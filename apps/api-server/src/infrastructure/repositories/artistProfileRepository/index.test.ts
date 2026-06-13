import { describe, it, expect, vi, beforeEach } from "vitest";
import { createArtistProfileRepository } from "./index";
import { isArtistProfileNotFoundError } from "../../../domain/artistProfiles/policies/assertArtistProfileExists";

// Drizzle のクエリビルダは「メソッドチェーン → await で解決」する。
// ここでは全メソッドが同一の builder を返し、await（=.then）ごとに
// enqueue した結果を順に resolve する thenable モックで代用する。
// where が select 中間でも delete 終端でも使われるため、終端名に依存しない設計にしている。
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

describe("createArtistProfileRepository", () => {
  let mock: ReturnType<typeof createDbMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createDbMock();
  });

  describe("findByArtistId", () => {
    it("行が無ければ null を返す（子テーブルを引かない）", async () => {
      mock.enqueue([]); // 本体クエリ: 0 件
      const repo = createArtistProfileRepository(mock.db as never);

      const result = await repo.findByArtistId("artist-1");

      expect(result).toBeNull();
    });

    it("プロフィールと子（ジャンル / SNS）を組み立てて返す", async () => {
      mock.enqueue(
        [profileRow], // 本体
        [{ genre: "bass" }, { genre: "inward" }], // genres
        [{ url: "https://x.com/taro" }], // sns
      );
      const repo = createArtistProfileRepository(mock.db as never);

      const result = await repo.findByArtistId("artist-1");

      expect(result?.getName()).toBe("Taro");
      expect(result?.getGenres()).toEqual(["bass", "inward"]);
      expect(result?.getSnsLinks()).toEqual(["https://x.com/taro"]);
      expect(result?.isPublished()).toBe(true);
    });
  });

  describe("findPublishedByAccountId", () => {
    it("公開行が無ければ null を返す", async () => {
      mock.enqueue([]);
      const repo = createArtistProfileRepository(mock.db as never);

      const result = await repo.findPublishedByAccountId("beatboxer_taro");

      expect(result).toBeNull();
    });
  });

  describe("upsert", () => {
    it("保存内容を反映した Entity を返し、子テーブルを置換する", async () => {
      mock.enqueue(
        [profileRow], // insert ... returning
        undefined, // delete genres
        undefined, // delete sns
        undefined, // insert genres
        undefined, // insert sns
      );
      const repo = createArtistProfileRepository(mock.db as never);

      const result = await repo.upsert({
        id: "profile-1",
        artistId: "artist-1",
        name: "Taro",
        tagline: null,
        imageUrl: "https://example.com/a.png",
        story: "私の歩み",
        activityInfo: null,
        genres: ["bass"],
        snsLinks: ["https://x.com/taro"],
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
      mock.enqueue([]); // update ... returning: 0 件
      const repo = createArtistProfileRepository(mock.db as never);

      await expect(
        repo.setPublished({ artistId: "artist-1", published: true }),
      ).rejects.toSatisfy(isArtistProfileNotFoundError);
    });
  });
});
