import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveMyProfile } from "./index";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../domain/artistProfiles/factories";
import type { ArtistProfilePersistenceData } from "../../../domain/artistProfiles/entities";
import type {
  IArtistProfileReader,
  IArtistProfileWriter,
} from "../../../domain/artistProfiles/repositories";
import type { Actor, ArtistWriteCapabilities } from "../../capabilities";

const existingUser = reconstructUser({
  id: "550e8400-e29b-41d4-a716-446655440000",
  subId: "auth0|123456789",
  email: "test@example.com",
});

const existingArtist = reconstructArtist({
  artistId: "artist-1",
  accountId: "beatboxer_taro",
  ownerUserId: existingUser.getId(),
  profile: null,
});

const actor: Actor = { user: existingUser, artist: existingArtist };

const echoUpsert = async (data: ArtistProfilePersistenceData) =>
  reconstructArtistProfile({ ...data });

const createCaps = () =>
  ({
    actor,
    artistProfiles: {
      findByArtistId: vi.fn<IArtistProfileReader["findByArtistId"]>(
        async () => null,
      ),
      findPublishedByAccountId: vi.fn<
        IArtistProfileReader["findPublishedByAccountId"]
      >(async () => null),
      listPublishedSummaries: vi.fn<
        IArtistProfileReader["listPublishedSummaries"]
      >(async () => []),
      upsert: vi.fn<IArtistProfileWriter["upsert"]>(echoUpsert),
      setPublished: vi.fn<IArtistProfileWriter["setPublished"]>(),
    },
  }) satisfies Pick<ArtistWriteCapabilities, "actor" | "artistProfiles">;

describe("saveMyProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("新規プロフィールを作成し、保存内容を view で返す", async () => {
    const caps = createCaps();

    const result = await saveMyProfile(caps, {
      name: "Taro",
      story: "私の歩み",
      genres: ["bass", "inward"],
      links: [{ type: "x", url: "https://x.com/taro" }],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accountId).toBe("beatboxer_taro");
      expect(result.value.profile.name).toBe("Taro");
      expect(result.value.profile.genres).toEqual(["bass", "inward"]);
      expect(result.value.profile.published).toBe(false);
    }
    expect(caps.artistProfiles.upsert).toHaveBeenCalledTimes(1);
  });

  it("actor の artistId で既存プロフィールを引く", async () => {
    const caps = createCaps();

    await saveMyProfile(caps, { name: "Taro" });

    expect(caps.artistProfiles.findByArtistId).toHaveBeenCalledWith("artist-1");
  });

  it("既存プロフィールがある場合は ID と公開状態を保持して更新する", async () => {
    const caps = createCaps();
    caps.artistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-existing",
        artistId: "artist-1",
        published: true,
        name: "Old Name",
      }),
    );

    await saveMyProfile(caps, { name: "New Name" });

    const persisted = caps.artistProfiles.upsert.mock.calls[0][0];
    expect(persisted.id).toBe("profile-existing");
    expect(persisted.published).toBe(true);
    expect(persisted.name).toBe("New Name");
  });

  it("不正な画像 URL は err(InvalidImageUrlFormatError)（保存しない）", async () => {
    const caps = createCaps();

    const result = await saveMyProfile(caps, { imageUrl: "not-a-url" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidImageUrlFormatError");
    }
    expect(caps.artistProfiles.upsert).not.toHaveBeenCalled();
  });

  it("既存プロフィール更新時の入力不正も err（スローしない）", async () => {
    const caps = createCaps();
    caps.artistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-existing",
        artistId: "artist-1",
        published: false,
        name: "Old Name",
      }),
    );

    const result = await saveMyProfile(caps, { imageUrl: "not-a-url" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidImageUrlFormatError");
    }
    expect(caps.artistProfiles.upsert).not.toHaveBeenCalled();
  });
});
