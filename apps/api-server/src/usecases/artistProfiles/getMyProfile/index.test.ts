import { describe, it, expect, vi, beforeEach } from "vitest";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../domain/artistProfiles/factories";
import { getMyProfile } from "./index";
import type { IArtistProfileReader } from "../../../domain/artistProfiles/repositories";
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
  }) satisfies ArtistReadCapabilities;

describe("getMyProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("プロフィール未作成なら profile と missingPublishFields を null で返す", async () => {
    const caps = createCaps();

    const result = await getMyProfile(caps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        handle: "beatboxer_taro",
        profile: null,
        missingPublishFields: null,
      });
    }
  });

  it("actor の artistId で引き、view を返す", async () => {
    const caps = createCaps();
    caps.artistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: false,
        name: "Taro",
      }),
    );

    const result = await getMyProfile(caps);

    expect(caps.artistProfiles.findByArtistId).toHaveBeenCalledWith("artist-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.profile?.name).toBe("Taro");
      expect(result.value.profile?.published).toBe(false);
    }
  });

  it("公開に足りない項目を missingPublishFields として返す", async () => {
    const caps = createCaps();
    caps.artistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: false,
        name: "Taro",
        story: "始めたきっかけ。",
        genres: ["Beatbox"],
      }),
    );

    const result = await getMyProfile(caps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.missingPublishFields).toStrictEqual([
        "imageUrl",
        "links",
      ]);
    }
  });

  it("公開可能なプロフィールなら missingPublishFields は空配列を返す", async () => {
    const caps = createCaps();
    caps.artistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: true,
        name: "Taro",
        imageUrl: "https://example.com/taro.jpg",
        story: "始めたきっかけ。",
        genres: ["Beatbox"],
        links: [{ type: "youtube", url: "https://youtube.com/@taro" }],
      }),
    );

    const result = await getMyProfile(caps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.missingPublishFields).toStrictEqual([]);
    }
  });
});
