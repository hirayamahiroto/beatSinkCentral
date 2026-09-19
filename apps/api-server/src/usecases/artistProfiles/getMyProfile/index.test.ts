import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getMyProfile } from "./index";
import { reconstructStoredProfile } from "../../../domain/artistProfiles/factories";
import { reconstructOffer } from "../../../domain/offers/factories";
import type { ProfileState } from "../../../domain/artistProfiles/entities";
import type { IArtistProfileReader } from "../../../domain/artistProfiles/repositories";
import type { IOfferReader } from "../../../domain/offers/repositories";
import type { ArtistReadCapabilities } from "../../../capabilities";
import { testUser, testArtist } from "../../../authorization/testDoubles";

const actor = { user: testUser, artist: testArtist };

const noProfile: ProfileState = { kind: "noProfile", artistId: "artist-1" };

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

const createCaps = (state: ProfileState) =>
  ({
    actor,
    artistProfiles: {
      load: vi.fn<IArtistProfileReader["load"]>(async () => state),
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
    const caps = createCaps(noProfile);

    const result = await getMyProfile(caps);

    expect(result).toStrictEqual({
      ok: true,
      value: {
        handle: "user_123",
        profile: null,
        publishability: null,
        offer: null,
      },
    });
    expect(caps.artistProfiles.load).toHaveBeenCalledExactlyOnceWith(
      "artist-1",
    );
  });

  it("下書きは集約の構造（attributes / story / links / published）と不足項目を返す", async () => {
    const caps = createCaps(
      reconstructStoredProfile({
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

    expect(result).toStrictEqual({
      ok: true,
      value: {
        handle: "user_123",
        profile: {
          attributes: {
            name: "Taro",
            imageUrl: null,
            tagline: null,
            genres: ["Beatbox"],
            activityInfo: null,
          },
          story: { chapters: [{ key: "beginning", body: "始めたきっかけ。" }] },
          links: [
            { linkTypeCode: "youtube", url: "https://youtube.com/@taro" },
          ],
          presentation: { patternCode: null },
          published: false,
        },
        publishability: { ok: false, missingFields: ["imageUrl"] },
        offer: null,
      },
    });
  });

  it("公開中は publishability.ok が true で missingFields は空", async () => {
    const caps = createCaps(
      reconstructStoredProfile({
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
      expect(result.value.profile?.published).toBe(true);
      expect(result.value.publishability).toStrictEqual({
        ok: true,
        missingFields: [],
      });
    }
  });

  it("開催日前のオファーがあれば、プロフィール未作成でも offer として返す", async () => {
    const caps = createCaps(noProfile);
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
    const caps = createCaps(noProfile);
    caps.offers.findLatestByArtistId.mockResolvedValue(offerOn("2026-09-01"));

    const result = await getMyProfile(caps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.offer).toBeNull();
    }
  });
});
