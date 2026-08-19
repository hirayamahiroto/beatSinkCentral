import { describe, it, expect, vi, beforeEach } from "vitest";
import { createArtistProfileReader, createArtistProfileWriter } from "./index";

const createDbMock = () => {
  const queue: unknown[] = [];
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
    builder[method] = vi.fn(chain);
  }
  builder.then = (
    resolve: (v: unknown) => unknown,
    reject: (e: unknown) => unknown,
  ) => Promise.resolve(queue.shift()).then(resolve, reject);

  return {
    db: builder,
    enqueue: (...values: unknown[]) => queue.push(...values),
    spy: (name: string) => builder[name] as ReturnType<typeof vi.fn>,
  };
};

const profileRow = {
  id: "profile-1",
  artistId: "artist-1",
  name: "Taro",
  tagline: null,
  imageUrl: "https://example.com/a.png",
  story: "私の歩み",
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

    it("プロフィールと子（ジャンル / リンク）を組み立てて返す", async () => {
      mock.enqueue(
        [profileRow],
        [{ genre: "bass" }, { genre: "inward" }],
        [{ type: "x", url: "https://x.com/taro", label: null }],
      );
      const reader = createArtistProfileReader(mock.db as never);

      const result = await reader.findByArtistId("artist-1");

      expect(result?.getName()).toBe("Taro");
      expect(result?.getGenres()).toEqual(["bass", "inward"]);
      expect(result?.getLinks()).toEqual([
        { type: "x", url: "https://x.com/taro", label: null },
      ]);
      expect(result?.isPublished()).toBe(true);
    });
  });

  describe("findPublishedByAccountId", () => {
    it("公開行が無ければ null を返す", async () => {
      mock.enqueue([]);
      const reader = createArtistProfileReader(mock.db as never);

      const result = await reader.findPublishedByAccountId("beatboxer_taro");

      expect(result).toBeNull();
    });
  });

  describe("listPublishedSummaries", () => {
    it("accountId / name / imageUrl の要約を返し、件数上限を渡す", async () => {
      mock.enqueue([
        { accountId: "taro", name: "Taro", imageUrl: "https://e.com/a.png" },
        { accountId: "hana", name: "Hana", imageUrl: null },
      ]);
      const reader = createArtistProfileReader(mock.db as never);

      const result = await reader.listPublishedSummaries({ limit: 100 });

      expect(result).toEqual([
        { accountId: "taro", name: "Taro", imageUrl: "https://e.com/a.png" },
        { accountId: "hana", name: "Hana", imageUrl: null },
      ]);
      expect(mock.spy("limit")).toHaveBeenCalledWith(100);
    });

    it("name が欠けた行は除外する", async () => {
      mock.enqueue([
        { accountId: "taro", name: "Taro", imageUrl: null },
        { accountId: "noname", name: null, imageUrl: null },
      ]);
      const reader = createArtistProfileReader(mock.db as never);

      const result = await reader.listPublishedSummaries({ limit: 100 });

      expect(result).toEqual([
        { accountId: "taro", name: "Taro", imageUrl: null },
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
    it("保存内容を反映した Entity を返し、子テーブルを置換する", async () => {
      mock.enqueue(
        [profileRow],
        undefined,
        undefined,
        undefined,
        [{ id: 1, code: "x" }],
        undefined,
      );
      const writer = createArtistProfileWriter(mock.db as never);

      const result = await writer.upsert({
        id: "profile-1",
        artistId: "artist-1",
        name: "Taro",
        tagline: null,
        imageUrl: "https://example.com/a.png",
        story: "私の歩み",
        activityInfo: null,
        genres: ["bass"],
        links: [{ type: "x", url: "https://x.com/taro", label: null }],
        published: false,
      });

      expect(mock.spy("insert")).toHaveBeenCalled();
      expect(mock.spy("delete")).toHaveBeenCalledTimes(2);
      expect(result.getName()).toBe("Taro");
      expect(result.getGenres()).toEqual(["bass"]);
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
