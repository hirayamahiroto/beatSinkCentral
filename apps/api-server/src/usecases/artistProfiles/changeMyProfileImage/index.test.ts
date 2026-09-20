import { describe, it, expect, vi, beforeEach } from "vitest";
import { changeMyProfileImage } from "./index";
import { reconstructStoredProfile } from "../../../domain/artistProfiles/factories";
import { toPersistence } from "../../../domain/artistProfiles/behaviors";
import type { ProfileState } from "../../../domain/artistProfiles/entities";
import type {
  IArtistProfileReader,
  IArtistProfileWriter,
} from "../../../domain/artistProfiles/repositories";
import type { ArtistWriteCapabilities } from "../../../capabilities";
import { testUser, testArtist } from "../../../authorization/testDoubles";

const actor = { user: testUser, artist: testArtist };

const createCaps = (
  state: ProfileState = { kind: "noProfile", artistId: "artist-1" },
) =>
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
      save: vi.fn<IArtistProfileWriter["save"]>(async (saved) => saved),
      publish: vi.fn<IArtistProfileWriter["publish"]>(),
    },
  }) satisfies Pick<ArtistWriteCapabilities, "actor" | "artistProfiles">;

describe("changeMyProfileImage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("プロフィール未作成なら下書きを起こして画像 URL を保存し、imageUrl だけを返す", async () => {
    const caps = createCaps();

    const result = await changeMyProfileImage(caps, {
      imageUrl: "https://example.com/new.png",
    });

    expect(result).toStrictEqual({
      ok: true,
      value: { imageUrl: "https://example.com/new.png" },
    });
    const saved = toPersistence(caps.artistProfiles.save.mock.calls[0][0]);
    expect(saved.artistId).toBe("artist-1");
    expect(saved.imageUrl).toBe("https://example.com/new.png");
    expect(saved.published).toBe(false);
  });

  it("既存プロフィールの画像だけを差し替え、他の構造と公開状態は保持する", async () => {
    const caps = createCaps(
      reconstructStoredProfile({
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

    const saved = toPersistence(caps.artistProfiles.save.mock.calls[0][0]);
    expect(saved.id).toBe("profile-existing");
    expect(saved.imageUrl).toBe("https://example.com/new.png");
    expect(saved.name).toBe("Taro");
    expect(saved.published).toBe(true);
  });

  it("不正な URL は err(InvalidImageUrlFormatError)（参照も保存もしない）", async () => {
    const caps = createCaps();

    const result = await changeMyProfileImage(caps, { imageUrl: "not-a-url" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidImageUrlFormatError");
    }
    expect(caps.artistProfiles.load).not.toHaveBeenCalled();
    expect(caps.artistProfiles.save).not.toHaveBeenCalled();
  });
});
