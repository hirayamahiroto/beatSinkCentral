import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { createOfferReader, createOfferWriter } from "./index";

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
    "leftJoin",
    "where",
    "limit",
    "orderBy",
    "insert",
    "values",
    "onConflictDoUpdate",
    "returning",
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

const offerRow = {
  id: "offer-1",
  artistId: "artist-1",
  date: "2026-09-20",
  place: "渋谷 WWW",
  ticketUrl: "https://tickets.example.com/e/1",
  comment: "新曲をやります",
};

describe("offerRepository", () => {
  let mock: ReturnType<typeof createDbMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createDbMock();
  });

  describe("findLatestByArtistId", () => {
    it("行が無ければ null を返す（共演者を引かない）", async () => {
      mock.enqueue([]);
      const reader = createOfferReader(mock.db as never);

      const result = await reader.findLatestByArtistId("artist-1");

      expect(result).toBeNull();
      expect(mock.spy("select")).toHaveBeenCalledTimes(1);
      expect(toSqlText(mock.spy("where").mock.calls[0][0])).toBe(
        '"offers"."artist_id" = $1',
      );
    });

    it("最新 1 件を引き、共演者は artists を leftJoin して handle 付きで組み立てる", async () => {
      mock.enqueue(
        [offerRow],
        [
          { name: "Hana", artistId: "artist-2", handle: "hana_bb" },
          { name: "Ken", artistId: null, handle: null },
        ],
      );
      const reader = createOfferReader(mock.db as never);

      const result = await reader.findLatestByArtistId("artist-1");

      expect(mock.spy("limit")).toHaveBeenCalledWith(1);
      expect(mock.spy("leftJoin")).toHaveBeenCalledTimes(1);
      expect(toSqlText(mock.spy("where").mock.calls[1][0])).toBe(
        '"offer_performers"."offer_id" = $1',
      );
      expect(result?.toPersistence()).toStrictEqual({
        id: "offer-1",
        artistId: "artist-1",
        date: "2026-09-20",
        place: "渋谷 WWW",
        ticketUrl: "https://tickets.example.com/e/1",
        comment: "新曲をやります",
        coPerformers: [
          { name: "Hana", artistId: "artist-2" },
          { name: "Ken", artistId: null },
        ],
      });
      expect(result?.toView().coPerformers).toStrictEqual([
        { name: "Hana", handle: "hana_bb" },
        { name: "Ken", handle: null },
      ]);
    });
  });

  describe("upsert", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-09-01T00:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const data = {
      id: "offer-1",
      artistId: "artist-1",
      date: "2026-09-20",
      place: "渋谷 WWW",
      ticketUrl: "https://tickets.example.com/e/1",
      comment: "新曲をやります",
      coPerformers: [
        { name: "Hana", artistId: "artist-2" },
        { name: "Ken", artistId: null },
      ],
    };

    it("id で衝突したら本人の行だけ内容を更新し、共演者は消してから順序付きで入れ直す", async () => {
      mock.enqueue([{ id: "offer-1" }], undefined, undefined);
      const writer = createOfferWriter(mock.db as never);

      await writer.upsert(data);

      expect(mock.spy("values").mock.calls[0][0]).toStrictEqual({
        id: "offer-1",
        artistId: "artist-1",
        heldOn: "2026-09-20",
        place: "渋谷 WWW",
        ticketUrl: "https://tickets.example.com/e/1",
        comment: "新曲をやります",
      });
      const conflict = mock.spy("onConflictDoUpdate").mock.calls[0][0];
      expect(conflict.set).toStrictEqual({
        heldOn: "2026-09-20",
        place: "渋谷 WWW",
        ticketUrl: "https://tickets.example.com/e/1",
        comment: "新曲をやります",
        updatedAt: new Date("2026-09-01T00:00:00.000Z"),
      });
      expect(toSqlText(conflict.setWhere)).toBe('"offers"."artist_id" = $1');
      expect(mock.spy("delete")).toHaveBeenCalledTimes(1);
      expect(toSqlText(mock.spy("where").mock.calls[0][0])).toBe(
        '"offer_performers"."offer_id" = $1',
      );
      expect(mock.spy("values").mock.calls[1][0]).toStrictEqual([
        {
          offerId: "offer-1",
          artistId: "artist-2",
          displayName: "Hana",
          sortOrder: 0,
        },
        {
          offerId: "offer-1",
          artistId: null,
          displayName: "Ken",
          sortOrder: 1,
        },
      ]);
    });

    it("共演者が空なら削除だけして insert しない", async () => {
      mock.enqueue([{ id: "offer-1" }], undefined);
      const writer = createOfferWriter(mock.db as never);

      await writer.upsert({ ...data, coPerformers: [] });

      expect(mock.spy("delete")).toHaveBeenCalledTimes(1);
      expect(mock.spy("insert")).toHaveBeenCalledTimes(1);
    });

    it("id が他の artist の行と衝突して更新されなければ例外を投げ、共演者に触れない", async () => {
      mock.enqueue([]);
      const writer = createOfferWriter(mock.db as never);

      await expect(writer.upsert(data)).rejects.toThrow(
        "upsert: offer does not belong to the artist",
      );
      expect(mock.spy("delete")).not.toHaveBeenCalled();
      expect(mock.spy("insert")).toHaveBeenCalledTimes(1);
    });
  });
});
