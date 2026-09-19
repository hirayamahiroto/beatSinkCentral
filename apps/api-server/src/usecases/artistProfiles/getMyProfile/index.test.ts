import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../domain/artistProfiles/factories";
import { reconstructOffer } from "../../../domain/offers/factories";
import { getMyProfile } from "./index";
import type { IArtistProfileReader } from "../../../domain/artistProfiles/repositories";
import type { IOfferReader } from "../../../domain/offers/repositories";
import type { Actor, ArtistReadCapabilities } from "../../capabilities";

const actor: Actor = {
  user: reconstructUser({
    id: "550e8400-e29b-41d4-a716-446655440000",
    subId: "auth0|123456789",
    email: "test@example.com",
  }),
  artist: reconstructArtist({
    artistId: "artist-1",
    handle: "beatboxer_taro",
    ownerUserId: "550e8400-e29b-41d4-a716-446655440000",
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
    coPerformers: [{ name: "Hana", artist: null }],
  });

const createCaps = () =>
  ({
    actor,
    artistProfiles: {
      findByArtistId: vi.fn<IArtistProfileReader["findByArtistId"]>(
        async () => null,
      ),
      findPublishedByHandle: vi.fn<
        IArtistProfileReader["findPublishedByHandle"]
      >(async () => null),
      listPublishedSummaries: vi.fn<
        IArtistProfileReader["listPublishedSummaries"]
      >(async () => []),
    },
    offers: {
      findLatestByArtistId: vi.fn<IOfferReader["findLatestByArtistId"]>(
        async () => null,
      ),
    },
  }) satisfies ArtistReadCapabilities;

describe("getMyProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-10T03:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("プロフィール未作成なら profile / publishability / offer を null で返す", async () => {
    const caps = createCaps();

    const result = await getMyProfile(caps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toStrictEqual({
        handle: "beatboxer_taro",
        profile: null,
        publishability: null,
        offer: null,
      });
    }
  });

  it("actor の artistId で引き、集約の構造（attributes / story / links / published）で返す", async () => {
    const caps = createCaps();
    caps.artistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: false,
        name: "Taro",
        chapters: [{ questionCode: "beginning", body: "始めたきっかけ。" }],
        genres: ["Beatbox"],
        links: [{ linkTypeCode: "youtube", url: "https://youtube.com/@taro" }],
      }),
    );

    const result = await getMyProfile(caps);

    expect(caps.artistProfiles.findByArtistId).toHaveBeenCalledWith("artist-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.profile).toStrictEqual({
        attributes: {
          name: "Taro",
          imageUrl: null,
          tagline: null,
          genres: ["Beatbox"],
          activityInfo: null,
        },
        story: { chapters: [{ key: "beginning", body: "始めたきっかけ。" }] },
        links: [{ linkTypeCode: "youtube", url: "https://youtube.com/@taro" }],
        presentation: { patternCode: null },
        published: false,
      });
    }
  });

  it("公開に足りない項目を publishability として返す", async () => {
    const caps = createCaps();
    caps.artistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: false,
        name: "Taro",
        chapters: [{ questionCode: "beginning", body: "始めたきっかけ。" }],
        genres: ["Beatbox"],
      }),
    );

    const result = await getMyProfile(caps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.publishability).toStrictEqual({
        ok: false,
        missingFields: ["imageUrl", "links"],
      });
    }
  });

  it("公開可能なプロフィールなら publishability.ok が true で missingFields は空", async () => {
    const caps = createCaps();
    caps.artistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: true,
        name: "Taro",
        imageUrl: "https://example.com/taro.jpg",
        chapters: [{ questionCode: "beginning", body: "始めたきっかけ。" }],
        genres: ["Beatbox"],
        links: [{ linkTypeCode: "youtube", url: "https://youtube.com/@taro" }],
      }),
    );

    const result = await getMyProfile(caps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.publishability).toStrictEqual({
        ok: true,
        missingFields: [],
      });
    }
  });

  it("開催日前のオファーがあれば、プロフィール未作成でも offer として返す", async () => {
    const caps = createCaps();
    caps.offers.findLatestByArtistId.mockResolvedValue(offerOn("2026-09-20"));

    const result = await getMyProfile(caps);

    expect(caps.offers.findLatestByArtistId).toHaveBeenCalledWith("artist-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.profile).toBeNull();
      expect(result.value.offer).toStrictEqual({
        date: "2026-09-20",
        place: "渋谷 WWW",
        ticketUrl: "https://tickets.example.com/e/1",
        comment: "新曲をやります",
        coPerformers: [{ name: "Hana", handle: null }],
      });
    }
  });

  it("最新のオファーが開催日を過ぎていれば offer は null", async () => {
    const caps = createCaps();
    caps.offers.findLatestByArtistId.mockResolvedValue(offerOn("2026-09-01"));

    const result = await getMyProfile(caps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.offer).toBeNull();
    }
  });
});
