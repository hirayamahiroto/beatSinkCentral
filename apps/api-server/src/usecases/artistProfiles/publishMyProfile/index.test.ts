import { describe, it, expect, vi, beforeEach } from "vitest";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../domain/artistProfiles/factories";
import { publishMyProfile } from "./index";
import { isProfileNotPublishableError } from "../../../domain/artistProfiles/policies/publishability";
import type {
  IArtistProfileReader,
  IArtistProfileWriter,
} from "../../../domain/artistProfiles/repositories";
import type { Actor, ArtistWriteCapabilities } from "../../capabilities";

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

const publishableProfile = () =>
  reconstructArtistProfile({
    id: "profile-1",
    artistId: "artist-1",
    published: false,
    name: "Taro",
    imageUrl: "https://example.com/a.png",
    chapters: [{ questionCode: "beginning", body: "私の歩み" }],
    genres: ["bass"],
    links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
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
      upsert: vi.fn<IArtistProfileWriter["upsert"]>(),
      setPublished: vi.fn<IArtistProfileWriter["setPublished"]>(),
    },
  }) satisfies Pick<ArtistWriteCapabilities, "actor" | "artistProfiles">;

describe("publishMyProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("最小核が揃っていれば公開でき、ok(published=true) を返す", async () => {
    const caps = createCaps();
    caps.artistProfiles.findByArtistId.mockResolvedValue(publishableProfile());
    caps.artistProfiles.setPublished.mockResolvedValue(
      publishableProfile().publish(),
    );

    const result = await publishMyProfile(caps, { published: true });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ published: true });
    }
    expect(caps.artistProfiles.setPublished).toHaveBeenCalledWith({
      artistId: "artist-1",
      published: true,
    });
  });

  it("最小核が欠けている状態で公開しようとすると err(ProfileNotPublishableError)", async () => {
    const caps = createCaps();
    caps.artistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: false,
        name: "Taro",
        links: [],
      }),
    );

    const result = await publishMyProfile(caps, { published: true });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isProfileNotPublishableError(result.error)).toBe(true);
      if (isProfileNotPublishableError(result.error)) {
        expect(result.error.missingFields).toEqual([
          "imageUrl",
          "story",
          "genres",
          "links",
        ]);
      }
    }
    expect(caps.artistProfiles.setPublished).not.toHaveBeenCalled();
  });

  it("非公開化は最小核を検証せず常に可能", async () => {
    const caps = createCaps();
    caps.artistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: true,
        name: "Taro",
      }),
    );
    caps.artistProfiles.setPublished.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: false,
        name: "Taro",
      }),
    );

    const result = await publishMyProfile(caps, { published: false });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ published: false });
    }
  });

  it("プロフィール未作成なら err(ArtistProfileNotFoundError)", async () => {
    const caps = createCaps();

    const result = await publishMyProfile(caps, { published: true });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("ArtistProfileNotFoundError");
    }
    expect(caps.artistProfiles.setPublished).not.toHaveBeenCalled();
  });
});
