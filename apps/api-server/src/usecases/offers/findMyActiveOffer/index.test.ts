import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { findMyActiveOffer } from "./index";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";
import { reconstructOffer } from "../../../domain/offers/factories";
import type { IOfferReader } from "../../../domain/offers/repositories";
import type { Actor, ArtistReadCapabilities } from "../../capabilities";

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

const offerOn = (date: string) =>
  reconstructOffer({
    id: "offer-1",
    artistId: "artist-1",
    date,
    place: "渋谷 WWW",
    ticketUrl: "https://tickets.example.com/e/1",
    comment: "新曲をやります",
    coPerformers: [],
  });

const createCaps = () =>
  ({
    actor,
    offers: {
      findLatestByArtistId: vi.fn<IOfferReader["findLatestByArtistId"]>(
        async () => null,
      ),
    },
  }) satisfies Pick<ArtistReadCapabilities, "actor" | "offers">;

describe("findMyActiveOffer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-10T03:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("actor の artistId で最新のオファーを引き、開催日前なら返す", async () => {
    const caps = createCaps();
    const offer = offerOn("2026-09-20");
    caps.offers.findLatestByArtistId.mockResolvedValue(offer);

    const result = await findMyActiveOffer(caps);

    expect(caps.offers.findLatestByArtistId).toHaveBeenCalledWith("artist-1");
    expect(result).toBe(offer);
  });

  it("最新のオファーが開催日を過ぎていれば null（行は消さない）", async () => {
    const caps = createCaps();
    caps.offers.findLatestByArtistId.mockResolvedValue(offerOn("2026-09-01"));

    expect(await findMyActiveOffer(caps)).toBeNull();
  });

  it("オファーが 1 件も無ければ null", async () => {
    const caps = createCaps();

    expect(await findMyActiveOffer(caps)).toBeNull();
  });
});
