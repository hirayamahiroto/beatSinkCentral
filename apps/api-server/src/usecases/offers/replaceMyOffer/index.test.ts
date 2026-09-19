import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { replaceMyOffer } from "./index";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";
import { reconstructOffer } from "../../../domain/offers/factories";
import type { IArtistReader } from "../../../domain/artists/repositories";
import type {
  IOfferReader,
  IOfferWriter,
} from "../../../domain/offers/repositories";
import type { Actor, ArtistWriteCapabilities } from "../../capabilities";

const actor: Actor = {
  user: reconstructUser({
    id: "user-1",
    subId: "auth0|123",
    email: "test@example.com",
  }),
  artist: reconstructArtist({
    artistId: "artist-1",
    handle: "beatboxer_taro",
    ownerUserId: "user-1",
    profile: null,
  }),
};

const hana = reconstructArtist({
  artistId: "artist-2",
  handle: "hana_bb",
  ownerUserId: "user-2",
  profile: { name: "Hana" },
});

const input = {
  date: "2026-09-20",
  place: "渋谷 WWW",
  ticketUrl: "https://tickets.example.com/e/1",
  comment: "新曲をやります",
  coPerformers: [
    { name: "Hana", handle: "hana_bb" },
    { name: "Ken", handle: null },
  ],
};

const existingOffer = (date: string) =>
  reconstructOffer({
    id: "offer-existing",
    artistId: "artist-1",
    date,
    place: "旧会場",
    ticketUrl: "https://tickets.example.com/e/0",
    comment: "旧コメント",
    coPerformers: [{ name: "Old", artist: null }],
  });

const createCaps = () =>
  ({
    actor,
    artists: {
      findByUserId: vi.fn<IArtistReader["findByUserId"]>(async () => null),
      findByHandle: vi.fn<IArtistReader["findByHandle"]>(async () => null),
      findByHandles: vi.fn<IArtistReader["findByHandles"]>(async () => []),
      save: vi.fn(),
      updateHandle: vi.fn(),
    },
    offers: {
      findLatestByArtistId: vi.fn<IOfferReader["findLatestByArtistId"]>(
        async () => null,
      ),
      upsert: vi.fn<IOfferWriter["upsert"]>(async () => undefined),
    },
  }) satisfies Pick<ArtistWriteCapabilities, "actor" | "artists" | "offers">;

describe("replaceMyOffer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-10T03:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("有効なオファーが無ければ新規に作り、共演者の handle を 1 クエリで解決して保存する", async () => {
    const caps = createCaps();
    caps.artists.findByHandles.mockResolvedValue([hana]);

    const result = await replaceMyOffer(caps, input);

    expect(caps.artists.findByHandles).toHaveBeenCalledExactlyOnceWith([
      "hana_bb",
    ]);
    expect(caps.offers.findLatestByArtistId).toHaveBeenCalledWith("artist-1");
    const persisted = caps.offers.upsert.mock.calls[0][0];
    expect(persisted).toStrictEqual({
      id: expect.any(String),
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
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toStrictEqual({
        offer: {
          date: "2026-09-20",
          place: "渋谷 WWW",
          ticketUrl: "https://tickets.example.com/e/1",
          comment: "新曲をやります",
          coPerformers: [
            { name: "Hana", handle: "hana_bb" },
            { name: "Ken", handle: null },
          ],
        },
      });
    }
  });

  it("有効なオファーがあれば同じ id のまま内容を差し替える", async () => {
    const caps = createCaps();
    caps.artists.findByHandles.mockResolvedValue([hana]);
    caps.offers.findLatestByArtistId.mockResolvedValue(
      existingOffer("2026-09-15"),
    );

    const result = await replaceMyOffer(caps, input);

    const persisted = caps.offers.upsert.mock.calls[0][0];
    expect(persisted.id).toBe("offer-existing");
    expect(persisted.place).toBe("渋谷 WWW");
    expect(persisted.coPerformers).toStrictEqual([
      { name: "Hana", artistId: "artist-2" },
      { name: "Ken", artistId: null },
    ]);
    expect(result.ok).toBe(true);
  });

  it("最新のオファーが開催日を過ぎていれば別の id で新しい行を作る（過去の行は残す）", async () => {
    const caps = createCaps();
    caps.artists.findByHandles.mockResolvedValue([hana]);
    caps.offers.findLatestByArtistId.mockResolvedValue(
      existingOffer("2026-09-01"),
    );

    await replaceMyOffer(caps, input);

    expect(caps.offers.upsert.mock.calls[0][0].id).not.toBe("offer-existing");
  });

  it("共演者に handle が無ければ artists を引かない", async () => {
    const caps = createCaps();

    await replaceMyOffer(caps, {
      ...input,
      coPerformers: [
        { name: "Ken", handle: null },
        { name: "Mai", handle: "  " },
      ],
    });

    expect(caps.artists.findByHandles).not.toHaveBeenCalled();
    expect(caps.offers.upsert.mock.calls[0][0].coPerformers).toStrictEqual([
      { name: "Ken", artistId: null },
      { name: "Mai", artistId: null },
    ]);
  });

  it("handle が見つからなければ err(CoPerformerNotFoundError) で保存しない", async () => {
    const caps = createCaps();

    const result = await replaceMyOffer(caps, input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("CoPerformerNotFoundError");
      expect(result.error).toMatchObject({ handle: "hana_bb" });
    }
    expect(caps.offers.upsert).not.toHaveBeenCalled();
  });

  it("handle の形式が不正なら err(InvalidHandleFormatError) で artists を引かない", async () => {
    const caps = createCaps();

    const result = await replaceMyOffer(caps, {
      ...input,
      coPerformers: [{ name: "Hana", handle: "@hana_bb" }],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidHandleFormatError");
    }
    expect(caps.artists.findByHandles).not.toHaveBeenCalled();
    expect(caps.offers.upsert).not.toHaveBeenCalled();
  });

  it("日付が不正なら err(InvalidCalendarDateFormatError) で保存しない", async () => {
    const caps = createCaps();
    caps.artists.findByHandles.mockResolvedValue([hana]);

    const result = await replaceMyOffer(caps, { ...input, date: "9/20" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidCalendarDateFormatError");
    }
    expect(caps.offers.upsert).not.toHaveBeenCalled();
  });

  it("開催日を過ぎた日付は err(OfferDatePassedError) で、現行オファーを読まず保存もしない", async () => {
    const caps = createCaps();
    caps.artists.findByHandles.mockResolvedValue([hana]);

    const result = await replaceMyOffer(caps, { ...input, date: "2026-09-09" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("OfferDatePassedError");
    }
    expect(caps.offers.findLatestByArtistId).not.toHaveBeenCalled();
    expect(caps.offers.upsert).not.toHaveBeenCalled();
  });

  it("日本時間の今日の日付は受け付ける", async () => {
    const caps = createCaps();
    caps.artists.findByHandles.mockResolvedValue([hana]);

    const result = await replaceMyOffer(caps, { ...input, date: "2026-09-10" });

    expect(result.ok).toBe(true);
    expect(caps.offers.upsert).toHaveBeenCalledTimes(1);
  });
});
