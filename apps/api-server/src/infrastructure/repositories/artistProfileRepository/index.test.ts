import { describe, it, expect, vi, beforeEach } from "vitest";
import { createArtistProfileReader, createArtistProfileWriter } from "./index";

const createDbMock = () => {
  const queue: unknown[] = [];
  const spies: Record<string, ReturnType<typeof vi.fn>> = {};
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  for (const method of [
    "select",
    "from",
    "innerJoin",
    "where",
    "limit",
    "orderBy",
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
        [{ type: "x", url: "https://x.com/taro", label: null }],
        [{ questionCode: "beginning", body: "私の歩み" }],
      );
      const reader = createArtistProfileReader(mock.db as never);

      const result = await reader.findByArtistId("artist-1");

      expect(result?.getName()).toBe("Taro");
      expect(result?.getGenres()).toEqual(["bass", "inward"]);
      expect(result?.getLinks()).toEqual([
        { type: "x", url: "https://x.com/taro", label: null },
      ]);
      expect(result?.getChapters()).toEqual([
        { questionCode: "beginning", body: "私の歩み" },
      ]);
      expect(result?.isPublished()).toBe(true);
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
    it("handle / name / imageUrl の要約を返し、件数上限を渡す", async () => {
      mock.enqueue([
        { handle: "taro", name: "Taro", imageUrl: "https://e.com/a.png" },
        { handle: "hana", name: "Hana", imageUrl: null },
      ]);
      const reader = createArtistProfileReader(mock.db as never);

      const result = await reader.listPublishedSummaries({ limit: 100 });

      expect(result).toEqual([
        { handle: "taro", name: "Taro", imageUrl: "https://e.com/a.png" },
        { handle: "hana", name: "Hana", imageUrl: null },
      ]);
      expect(mock.spy("limit")).toHaveBeenCalledWith(100);
    });

    it("name が欠けた行は除外する", async () => {
      mock.enqueue([
        { handle: "taro", name: "Taro", imageUrl: null },
        { handle: "noname", name: null, imageUrl: null },
      ]);
      const reader = createArtistProfileReader(mock.db as never);

      const result = await reader.listPublishedSummaries({ limit: 100 });

      expect(result).toEqual([
        { handle: "taro", name: "Taro", imageUrl: null },
      ]);
    });

    it("公開行が無ければ空配列を返す（子テーブルを引かない）", async () => {
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
        links: [{ type: "x", url: "https://x.com/taro", label: null }],
        published: false,
      });

      expect(mock.spy("insert")).toHaveBeenCalled();
      expect(mock.spy("delete")).toHaveBeenCalledTimes(3);
      expect(result.getName()).toBe("Taro");
      expect(result.getGenres()).toEqual(["bass"]);
      expect(result.getChapters()).toEqual([
        { questionCode: "beginning", body: "私の歩み" },
      ]);
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
          published: false,
        }),
      ).rejects.toThrow();
    });
  });

  describe("setPublished", () => {
    it("対象が無ければ ArtistProfileNotFoundError をスローする", async () => {
      mock.enqueue([]);
      const writer = createArtistProfileWriter(mock.db as never);

      await expect(
        writer.setPublished({ artistId: "artist-1", published: true }),
      ).rejects.toThrow();
    });
  });
});
