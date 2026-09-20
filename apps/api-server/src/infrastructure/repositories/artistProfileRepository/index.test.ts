import { describe, it, expect, vi, beforeEach } from "vitest";
import { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { createArtistProfileReader, createArtistProfileWriter } from "./index";
import { reconstructStoredProfile } from "../../../domain/artistProfiles/factories";
import { toView } from "../../../domain/artistProfiles/behaviors";
import type { PublishedProfile } from "../../../domain/artistProfiles/entities";

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

const publishedRow = {
  id: "profile-1",
  artistId: "artist-1",
  name: "Taro",
  tagline: null,
  imageUrl: "https://example.com/a.png",
  activityInfo: null,
  presentationPatternCode: null,
  published: true,
};

const draftRow = { ...publishedRow, published: false };

const draftProfile = reconstructStoredProfile({
  id: "profile-1",
  artistId: "artist-1",
  published: false,
  name: "Taro",
  imageUrl: "https://example.com/a.png",
  chapters: [{ questionCode: "beginning", body: "私の歩み" }],
  genres: ["bass"],
  links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
});

const publishedProfile = (): PublishedProfile => {
  const state = reconstructStoredProfile({
    id: "profile-1",
    artistId: "artist-1",
    published: true,
    name: "Taro",
    imageUrl: "https://example.com/a.png",
    chapters: [{ questionCode: "beginning", body: "私の歩み" }],
    genres: ["bass"],
    links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
  });
  if (state.kind !== "published") throw new Error("fixture must be published");
  return state;
};

describe("artistProfileRepository", () => {
  let mock: ReturnType<typeof createDbMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createDbMock();
  });

  describe("load", () => {
    it("行が無ければ noProfile を返す（子テーブルを引かない）", async () => {
      mock.enqueue([]);
      const reader = createArtistProfileReader(mock.db as never);

      const result = await reader.load("artist-1");

      expect(result).toStrictEqual({ kind: "noProfile", artistId: "artist-1" });
      expect(mock.spy("select")).toHaveBeenCalledTimes(1);
    });

    it("published=false の行は子（ジャンル / リンク / Story章）を組み立てて draft で返す", async () => {
      mock.enqueue(
        [draftRow],
        [{ genre: "bass" }, { genre: "inward" }],
        [{ linkTypeCode: "x", url: "https://x.com/taro" }],
        [{ questionCode: "beginning", body: "私の歩み" }],
      );
      const reader = createArtistProfileReader(mock.db as never);

      const result = await reader.load("artist-1");

      expect(result.kind).toBe("draft");
      if (result.kind === "noProfile") throw new Error("unreachable");
      expect(toView(result)).toMatchObject({
        attributes: { name: "Taro", genres: ["bass", "inward"] },
        links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
        story: { chapters: [{ key: "beginning", body: "私の歩み" }] },
        presentation: { patternCode: null },
        published: false,
      });
    });

    it("published=true で最小核が揃った行は published で返し、表現パターンはマスタを leftJoin してコードで返す", async () => {
      mock.enqueue(
        [{ ...publishedRow, presentationPatternCode: "editorial" }],
        [{ genre: "bass" }],
        [{ linkTypeCode: "x", url: "https://x.com/taro" }],
        [{ questionCode: "beginning", body: "私の歩み" }],
      );
      const reader = createArtistProfileReader(mock.db as never);

      const result = await reader.load("artist-1");

      expect(mock.spy("leftJoin")).toHaveBeenCalledTimes(1);
      expect(result.kind).toBe("published");
      if (result.kind === "noProfile") throw new Error("unreachable");
      expect(toView(result).presentation.patternCode).toBe("editorial");
    });

    it("published=true なのに最小核が欠けた行はスローする（不変条件の破れ）", async () => {
      mock.enqueue([publishedRow], [], [], []);
      const reader = createArtistProfileReader(mock.db as never);

      await expect(reader.load("artist-1")).rejects.toThrow(
        "published profile lacks required fields",
      );
    });
  });

  describe("findPublishedByHandle", () => {
    it("公開行が無ければ null を返す", async () => {
      mock.enqueue([]);
      const reader = createArtistProfileReader(mock.db as never);

      const result = await reader.findPublishedByHandle("beatboxer_taro");

      expect(result).toBeNull();
    });

    it("公開行は PublishedProfile として返す", async () => {
      mock.enqueue(
        [publishedRow],
        [{ genre: "bass" }],
        [{ linkTypeCode: "x", url: "https://x.com/taro" }],
        [{ questionCode: "beginning", body: "私の歩み" }],
      );
      const reader = createArtistProfileReader(mock.db as never);

      const result = await reader.findPublishedByHandle("beatboxer_taro");

      expect(result?.kind).toBe("published");
      expect(result?.artistId).toBe("artist-1");
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
  });

  describe("save", () => {
    it("状態を永続化データにして upsert し、子テーブル（ジャンル / リンク / Story章）を置換する", async () => {
      mock.enqueue(
        [draftRow], // insert ... returning
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

      const result = await writer.save(draftProfile);

      expect(mock.spy("values").mock.calls[0][0]).toStrictEqual({
        id: "profile-1",
        artistId: "artist-1",
        name: "Taro",
        tagline: null,
        imageUrl: "https://example.com/a.png",
        activityInfo: null,
        presentationPatternId: null,
        published: false,
        publishedAt: null,
      });
      expect(mock.spy("delete")).toHaveBeenCalledTimes(3);
      expect(mock.spy("values").mock.calls[2][0]).toEqual([
        {
          artistProfileId: "profile-1",
          linkTypeId: 1,
          url: "https://x.com/taro",
          sortOrder: 0,
        },
      ]);
      expect(result.kind).toBe("draft");
      expect(toView(result).attributes.genres).toEqual(["bass"]);
    });

    it("既存行との衝突時は published を「現在値 AND 保存値」で降格のみ反映し、降格時は publishedAt を消す（並行する publish を戻さない）", async () => {
      mock.enqueue([draftRow], undefined, undefined, undefined);
      const writer = createArtistProfileWriter(mock.db as never);

      await writer.save({
        kind: "draft",
        id: "profile-1",
        artistId: "artist-1",
        content: {
          ...draftProfile.content,
          genres: [],
          links: [],
          chapters: [],
        },
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

    it("presentationPatternCode はマスタで id に解決して保存し、状態にはコードのまま戻す", async () => {
      mock.enqueue(
        [{ id: 3 }], // resolvePresentationPatternId select
        [draftRow], // insert ... returning
        undefined, // delete genres
        undefined, // delete links
        undefined, // delete chapters
      );
      const writer = createArtistProfileWriter(mock.db as never);

      const result = await writer.save({
        kind: "draft",
        id: "profile-1",
        artistId: "artist-1",
        content: {
          ...draftProfile.content,
          genres: [],
          links: [],
          chapters: [],
          presentationPattern: "spotlight",
        },
      });

      expect(mock.spy("values").mock.calls[0][0]).toMatchObject({
        presentationPatternId: 3,
      });
      expect(
        mock.spy("onConflictDoUpdate").mock.calls[0][0].set
          .presentationPatternId,
      ).toBe(3);
      expect(toView(result).presentation.patternCode).toBe("spotlight");
    });

    it("マスタに無い presentationPatternCode は InvalidPresentationPatternError を投げ、保存しない", async () => {
      mock.enqueue([]); // resolvePresentationPatternId select（該当コード無し）
      const writer = createArtistProfileWriter(mock.db as never);

      await expect(
        writer.save({
          kind: "draft",
          id: "profile-1",
          artistId: "artist-1",
          content: {
            ...draftProfile.content,
            presentationPattern: "spotlight",
          },
        }),
      ).rejects.toMatchObject({ type: "InvalidPresentationPatternError" });
      expect(mock.spy("insert")).not.toHaveBeenCalled();
    });
  });

  describe("publish", () => {
    it("published=true と publishedAt を書き、PublishedProfile を返す", async () => {
      mock.enqueue(
        [publishedRow], // insert ... returning
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

      const result = await writer.publish(publishedProfile());

      expect(mock.spy("values").mock.calls[0][0]).toMatchObject({
        published: true,
        publishedAt: expect.any(Date),
      });
      const { set } = mock.spy("onConflictDoUpdate").mock.calls[0][0];
      expect(set.published).toBe(true);
      expect(set.publishedAt).toBeInstanceOf(Date);
      expect(result.kind).toBe("published");
    });
  });
});
