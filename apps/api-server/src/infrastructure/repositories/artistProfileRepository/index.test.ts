import { describe, it, expect, vi, beforeEach } from "vitest";
import { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { createArtistProfileReader, createArtistProfileWriter } from "./index";

const toSqlText = (fragment: SQL): string =>
  new PgDialect().sqlToQuery(fragment).sql;

const createDbMock = () => {
  const queue: unknown[] = [];
  const spies: Record<string, ReturnType<typeof vi.fn>> = {};
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  for (const method of [
    "select",
    "from",
    "innerJoin",
    "leftJoin",
    "where",
    "limit",
    "orderBy",
    "groupBy",
    "as",
    "insert",
    "values",
    "onConflictDoUpdate",
    "returning",
    "update",
    "set",
    "delete",
  ]) {
    const spy = vi.fn(chain);
    spies[method] = spy;
    builder[method] = spy;
  }
  builder.then = (
    resolve: (v: unknown) => unknown,
    reject: (e: unknown) => unknown,
  ) => Promise.resolve(queue.shift()).then(resolve, reject);

  return {
    db: builder,
    enqueue: (...values: unknown[]) => queue.push(...values),
    spy: (name: string) => spies[name],
  };
};

const profileRow = {
  id: "profile-1",
  artistId: "artist-1",
  name: "Taro",
  tagline: null,
  imageUrl: "https://example.com/a.png",
  activityInfo: null,
  presentationPatternCode: null,
  published: true,
};

describe("artistProfileRepository", () => {
  let mock: ReturnType<typeof createDbMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createDbMock();
  });

  describe("findByArtistId", () => {
    it("行が無ければ null を返す（子テーブルを引かない）", async () => {
      mock.enqueue([]);
      const reader = createArtistProfileReader(mock.db as never);

      const result = await reader.findByArtistId("artist-1");

      expect(result).toBeNull();
    });

    it("プロフィールと子（ジャンル / リンク / Story章）を組み立てて返す", async () => {
      mock.enqueue(
        [profileRow],
        [{ genre: "bass" }, { genre: "inward" }],
        [{ linkTypeCode: "x", url: "https://x.com/taro" }],
        [{ questionCode: "beginning", body: "私の歩み" }],
      );
      const reader = createArtistProfileReader(mock.db as never);

      const result = await reader.findByArtistId("artist-1");

      expect(result?.getName()).toBe("Taro");
      expect(result?.getGenres()).toEqual(["bass", "inward"]);
      expect(result?.getLinks()).toStrictEqual([
        { linkTypeCode: "x", url: "https://x.com/taro" },
      ]);
      expect(result?.getChapters()).toEqual([
        { questionCode: "beginning", body: "私の歩み" },
      ]);
      expect(result?.isPublished()).toBe(true);
      expect(result?.toView().presentation.patternCode).toBeNull();
    });

    it("表現パターンはマスタを leftJoin してコードで返す", async () => {
      mock.enqueue(
        [{ ...profileRow, presentationPatternCode: "editorial" }],
        [],
        [],
        [],
      );
      const reader = createArtistProfileReader(mock.db as never);

      const result = await reader.findByArtistId("artist-1");

      expect(mock.spy("leftJoin")).toHaveBeenCalledTimes(1);
      expect(result?.toView().presentation.patternCode).toBe("editorial");
    });
  });

  describe("findPublishedByHandle", () => {
    it("公開行が無ければ null を返す", async () => {
      mock.enqueue([]);
      const reader = createArtistProfileReader(mock.db as never);

      const result = await reader.findPublishedByHandle("beatboxer_taro");

      expect(result).toBeNull();
    });
  });

  describe("listPublishedSummaries", () => {
    it("handle / name / imageUrl / tagline / genres の要約を返し、件数上限を渡す", async () => {
      mock.enqueue([
        {
          handle: "taro",
          name: "Taro",
          imageUrl: "https://e.com/a.png",
          tagline: "音で旅する",
          genres: ["bass", "inward"],
        },
        {
          handle: "hana",
          name: "Hana",
          imageUrl: null,
          tagline: null,
          genres: [],
        },
      ]);
      const reader = createArtistProfileReader(mock.db as never);

      const result = await reader.listPublishedSummaries({ limit: 100 });

      expect(result).toStrictEqual([
        {
          handle: "taro",
          name: "Taro",
          imageUrl: "https://e.com/a.png",
          tagline: "音で旅する",
          genres: ["bass", "inward"],
        },
        {
          handle: "hana",
          name: "Hana",
          imageUrl: null,
          tagline: null,
          genres: [],
        },
      ]);
      expect(mock.spy("limit")).toHaveBeenCalledWith(100);
    });

    it("ジャンルはサブクエリで集約して 1 クエリで引く（N+1 にしない）", async () => {
      mock.enqueue([]);
      const reader = createArtistProfileReader(mock.db as never);

      await reader.listPublishedSummaries({ limit: 100 });

      expect(mock.spy("groupBy")).toHaveBeenCalledTimes(1);
      expect(mock.spy("leftJoin")).toHaveBeenCalledTimes(1);
      expect(mock.spy("select")).toHaveBeenCalledTimes(2);
    });

    it("name が欠けた行は除外する", async () => {
      mock.enqueue([
        {
          handle: "taro",
          name: "Taro",
          imageUrl: null,
          tagline: null,
          genres: [],
        },
        {
          handle: "noname",
          name: null,
          imageUrl: null,
          tagline: null,
          genres: [],
        },
      ]);
      const reader = createArtistProfileReader(mock.db as never);

      const result = await reader.listPublishedSummaries({ limit: 100 });

      expect(result).toStrictEqual([
        {
          handle: "taro",
          name: "Taro",
          imageUrl: null,
          tagline: null,
          genres: [],
        },
      ]);
    });

    it("公開行が無ければ空配列を返す", async () => {
      mock.enqueue([]);
      const reader = createArtistProfileReader(mock.db as never);

      const result = await reader.listPublishedSummaries({ limit: 100 });

      expect(result).toEqual([]);
      expect(mock.spy("orderBy")).toHaveBeenCalled();
    });
  });

  describe("upsert", () => {
    it("保存内容を反映した Entity を返し、子テーブル（ジャンル / リンク / Story章）を置換する", async () => {
      mock.enqueue(
        [profileRow], // insert ... returning
        undefined, // delete genres
        undefined, // delete links
        undefined, // delete chapters
        undefined, // insert genres
        [{ id: 1, code: "x" }], // resolveLinkTypeIds select
        undefined, // insert links
        [{ id: 1, code: "beginning" }], // resolveStoryQuestionIds select
        undefined, // insert chapters
      );
      const writer = createArtistProfileWriter(mock.db as never);

      const result = await writer.upsert({
        id: "profile-1",
        artistId: "artist-1",
        name: "Taro",
        tagline: null,
        imageUrl: "https://example.com/a.png",
        chapters: [{ questionCode: "beginning", body: "私の歩み" }],
        activityInfo: null,
        genres: ["bass"],
        links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
        presentationPatternCode: null,
        published: false,
      });

      expect(mock.spy("insert")).toHaveBeenCalled();
      expect(mock.spy("delete")).toHaveBeenCalledTimes(3);
      expect(mock.spy("values").mock.calls[2][0]).toEqual([
        {
          artistProfileId: "profile-1",
          linkTypeId: 1,
          url: "https://x.com/taro",
          sortOrder: 0,
        },
      ]);
      expect(result.getName()).toBe("Taro");
      expect(result.getGenres()).toEqual(["bass"]);
      expect(result.getChapters()).toEqual([
        { questionCode: "beginning", body: "私の歩み" },
      ]);
    });

    it("既存行との衝突時は published を「現在値 AND 保存値」で降格のみ反映し、降格時は publishedAt を消す（並行する publish を戻さない）", async () => {
      mock.enqueue([profileRow], undefined, undefined, undefined);
      const writer = createArtistProfileWriter(mock.db as never);

      await writer.upsert({
        id: "profile-1",
        artistId: "artist-1",
        name: "Taro",
        tagline: null,
        imageUrl: null,
        chapters: [],
        activityInfo: null,
        genres: [],
        links: [],
        presentationPatternCode: null,
        published: false,
      });

      const { set } = mock.spy("onConflictDoUpdate").mock.calls[0][0];
      expect(set.presentationPatternId).toBeNull();
      expect(set.published).toBeInstanceOf(SQL);
      expect(set.publishedAt).toBeInstanceOf(SQL);
      expect(toSqlText(set.published)).toBe(
        '"artist_profiles"."published" and excluded.published',
      );
      expect(toSqlText(set.publishedAt)).toBe(
        'case when excluded.published then "artist_profiles"."published_at" else null end',
      );
    });

    it("未知の questionCode の章は InvalidStoryChapterFormatError を投げる（データ破損防御）", async () => {
      mock.enqueue(
        [profileRow], // insert ... returning
        undefined, // delete genres
        undefined, // delete links
        undefined, // delete chapters
        [], // resolveStoryQuestionIds select（該当コード無し）
      );
      const writer = createArtistProfileWriter(mock.db as never);

      await expect(
        writer.upsert({
          id: "profile-1",
          artistId: "artist-1",
          name: "Taro",
          tagline: null,
          imageUrl: null,
          chapters: [{ questionCode: "beginning", body: "私の歩み" }],
          activityInfo: null,
          genres: [],
          links: [],
          presentationPatternCode: null,
          published: false,
        }),
      ).rejects.toThrow();
    });

    it("presentationPatternCode はマスタで id に解決して保存し、Entity にはコードのまま戻す", async () => {
      mock.enqueue(
        [{ id: 3 }], // resolvePresentationPatternId select
        [profileRow], // insert ... returning
        undefined, // delete genres
        undefined, // delete links
        undefined, // delete chapters
      );
      const writer = createArtistProfileWriter(mock.db as never);

      const result = await writer.upsert({
        id: "profile-1",
        artistId: "artist-1",
        name: "Taro",
        tagline: null,
        imageUrl: null,
        chapters: [],
        activityInfo: null,
        genres: [],
        links: [],
        presentationPatternCode: "spotlight",
        published: false,
      });

      expect(mock.spy("values").mock.calls[0][0]).toStrictEqual({
        id: "profile-1",
        artistId: "artist-1",
        name: "Taro",
        tagline: null,
        imageUrl: null,
        activityInfo: null,
        presentationPatternId: 3,
        published: false,
      });
      expect(
        mock.spy("onConflictDoUpdate").mock.calls[0][0].set
          .presentationPatternId,
      ).toBe(3);
      expect(result.toView().presentation.patternCode).toBe("spotlight");
    });

    it("未知の presentationPatternCode は InvalidPresentationPatternError を投げ、保存しない", async () => {
      mock.enqueue([]); // resolvePresentationPatternId select（該当コード無し）
      const writer = createArtistProfileWriter(mock.db as never);

      await expect(
        writer.upsert({
          id: "profile-1",
          artistId: "artist-1",
          name: "Taro",
          tagline: null,
          imageUrl: null,
          chapters: [],
          activityInfo: null,
          genres: [],
          links: [],
          presentationPatternCode: "carousel",
          published: false,
        }),
      ).rejects.toMatchObject({ type: "InvalidPresentationPatternError" });
      expect(mock.spy("insert")).not.toHaveBeenCalled();
    });
  });

  describe("setPublished", () => {
    it("公開状態を更新し、子テーブルと表現パターンを読み戻した Entity を返す", async () => {
      mock.enqueue(
        [{ ...profileRow, published: true }], // update ... returning
        [{ genre: "bass" }], // genres
        [], // links
        [], // chapters
        [{ code: "editorial" }], // presentation pattern code
      );
      const writer = createArtistProfileWriter(mock.db as never);

      const result = await writer.setPublished({
        artistId: "artist-1",
        published: true,
      });

      expect(mock.spy("update")).toHaveBeenCalledTimes(1);
      expect(result.isPublished()).toBe(true);
      expect(result.getGenres()).toEqual(["bass"]);
      expect(result.toView().presentation.patternCode).toBe("editorial");
    });

    it("対象が無ければ ArtistProfileNotFoundError をスローする", async () => {
      mock.enqueue([]);
      const writer = createArtistProfileWriter(mock.db as never);

      await expect(
        writer.setPublished({ artistId: "artist-1", published: true }),
      ).rejects.toThrow();
    });
  });
});
