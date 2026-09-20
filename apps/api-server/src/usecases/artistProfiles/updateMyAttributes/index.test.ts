import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateMyAttributes } from "./index";
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

const publishedContent = {
  id: "profile-existing",
  artistId: "artist-1",
  published: true,
  name: "Taro",
  imageUrl: "https://example.com/taro.png",
  chapters: [{ questionCode: "beginning", body: "私の歩み" }],
  genres: ["bass"],
  links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
};

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

describe("updateMyAttributes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("プロフィール未作成なら下書きを起こして属性を保存し、attributes だけを返す", async () => {
    const caps = createCaps();

    const result = await updateMyAttributes(caps, {
      name: "Taro",
      tagline: "音で旅する",
      genres: ["bass", "inward"],
      activityInfo: "東京 / ソロ",
    });

    expect(result).toStrictEqual({
      ok: true,
      value: {
        attributes: {
          name: "Taro",
          imageUrl: null,
          tagline: "音で旅する",
          genres: ["bass", "inward"],
          activityInfo: "東京 / ソロ",
        },
      },
    });
    expect(caps.artistProfiles.load).toHaveBeenCalledExactlyOnceWith(
      "artist-1",
    );
    const saved = caps.artistProfiles.save.mock.calls[0][0];
    expect(saved.kind).toBe("draft");
    expect(saved.artistId).toBe("artist-1");
  });

  it("既存プロフィールがある場合は ID・画像・章・リンク・公開状態を保持して属性だけ更新する", async () => {
    const caps = createCaps(reconstructStoredProfile(publishedContent));

    await updateMyAttributes(caps, { name: "New Name", genres: ["loop"] });

    expect(
      toPersistence(caps.artistProfiles.save.mock.calls[0][0]),
    ).toStrictEqual({
      id: "profile-existing",
      artistId: "artist-1",
      name: "New Name",
      tagline: null,
      imageUrl: "https://example.com/taro.png",
      chapters: [{ questionCode: "beginning", body: "私の歩み" }],
      activityInfo: null,
      genres: ["loop"],
      links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
      presentationPatternCode: null,
      published: true,
    });
  });

  it("公開中の更新で公開条件を割ったら下書きに落として保存する", async () => {
    const caps = createCaps(reconstructStoredProfile(publishedContent));

    const result = await updateMyAttributes(caps, { name: null });

    expect(caps.artistProfiles.save.mock.calls[0][0].kind).toBe("draft");
    expect(result.ok).toBe(true);
  });

  it("不正な name は err(InvalidProfileNameFormatError)（参照も保存もしない）", async () => {
    const caps = createCaps();

    const result = await updateMyAttributes(caps, { name: "a".repeat(256) });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidProfileNameFormatError");
    }
    expect(caps.artistProfiles.load).not.toHaveBeenCalled();
    expect(caps.artistProfiles.save).not.toHaveBeenCalled();
  });
});
