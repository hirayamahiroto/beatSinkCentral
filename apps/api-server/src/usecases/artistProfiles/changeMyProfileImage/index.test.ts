import { describe, it, expect, vi, beforeEach } from "vitest";
import { changeMyProfileImage } from "./index";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../domain/artistProfiles/factories";
import type { ArtistProfilePersistenceData } from "../../../domain/artistProfiles/entities";
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

const echoUpsert = async (data: ArtistProfilePersistenceData) =>
  reconstructArtistProfile({ ...data });

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
      upsert: vi.fn<IArtistProfileWriter["upsert"]>(echoUpsert),
      setPublished: vi.fn<IArtistProfileWriter["setPublished"]>(),
    },
  }) satisfies Pick<ArtistWriteCapabilities, "actor" | "artistProfiles">;

describe("changeMyProfileImage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("プロフィール未作成なら下書きを作って画像 URL を保存し、imageUrl だけを返す", async () => {
    const caps = createCaps();

    const result = await changeMyProfileImage(caps, {
      imageUrl: "https://example.com/new.png",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toStrictEqual({
        imageUrl: "https://example.com/new.png",
      });
    }
    const persisted = caps.artistProfiles.upsert.mock.calls[0][0];
    expect(persisted.artistId).toBe("artist-1");
    expect(persisted.imageUrl).toBe("https://example.com/new.png");
    expect(persisted.published).toBe(false);
  });

  it("既存プロフィールの画像だけを差し替え、他の構造と公開状態は保持する", async () => {
    const caps = createCaps();
    caps.artistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-existing",
        artistId: "artist-1",
        published: true,
        name: "Taro",
        imageUrl: "https://example.com/old.png",
        chapters: [{ questionCode: "beginning", body: "私の歩み" }],
        genres: ["bass"],
        links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
      }),
    );

    await changeMyProfileImage(caps, {
      imageUrl: "https://example.com/new.png",
    });

    expect(caps.artistProfiles.findByArtistId).toHaveBeenCalledWith("artist-1");
    const persisted = caps.artistProfiles.upsert.mock.calls[0][0];
    expect(persisted.id).toBe("profile-existing");
    expect(persisted.imageUrl).toBe("https://example.com/new.png");
    expect(persisted.name).toBe("Taro");
    expect(persisted.published).toBe(true);
  });

  it("不正な URL は err(InvalidImageUrlFormatError)（参照も保存もしない）", async () => {
    const caps = createCaps();

    const result = await changeMyProfileImage(caps, { imageUrl: "not-a-url" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidImageUrlFormatError");
    }
    expect(caps.artistProfiles.findByArtistId).not.toHaveBeenCalled();
    expect(caps.artistProfiles.upsert).not.toHaveBeenCalled();
  });
});
