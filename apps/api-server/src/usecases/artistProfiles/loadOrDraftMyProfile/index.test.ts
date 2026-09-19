import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadOrDraftMyProfile } from "./index";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../domain/artistProfiles/factories";
import type {
  IArtistProfileReader,
  IArtistProfileWriter,
} from "../../../domain/artistProfiles/repositories";
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

describe("loadOrDraftMyProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("actor の artistId で既存プロフィールを引き、あればそれを返す", async () => {
    const caps = createCaps();
    const existing = reconstructArtistProfile({
      id: "profile-1",
      artistId: "artist-1",
      published: true,
      name: "Taro",
    });
    caps.artistProfiles.findByArtistId.mockResolvedValue(existing);

    const profile = await loadOrDraftMyProfile(caps);

    expect(caps.artistProfiles.findByArtistId).toHaveBeenCalledWith("artist-1");
    expect(profile).toBe(existing);
  });

  it("無ければ actor の artistId で空の非公開下書きを作る", async () => {
    const caps = createCaps();

    const profile = await loadOrDraftMyProfile(caps);

    expect(profile.getArtistId()).toBe("artist-1");
    expect(profile.isPublished()).toBe(false);
    expect(profile.getName()).toBeNull();
    expect(profile.getChapters()).toEqual([]);
    expect(profile.getLinks()).toEqual([]);
  });
});
