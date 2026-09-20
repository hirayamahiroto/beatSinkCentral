import { describe, it, expect, vi, beforeEach } from "vitest";
import { replaceMyLinks } from "./index";
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

describe("replaceMyLinks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("プロフィール未作成なら下書きを起こしてリンクを保存し、links だけを返す", async () => {
    const caps = createCaps();

    const result = await replaceMyLinks(caps, {
      links: [
        { linkTypeCode: "youtube", url: "https://youtube.com/@taro" },
        { linkTypeCode: "x", url: "https://x.com/taro" },
      ],
    });

    expect(result).toStrictEqual({
      ok: true,
      value: {
        links: [
          { linkTypeCode: "youtube", url: "https://youtube.com/@taro" },
          { linkTypeCode: "x", url: "https://x.com/taro" },
        ],
      },
    });
    expect(caps.artistProfiles.save.mock.calls[0][0].artistId).toBe("artist-1");
  });

  it("既存プロフィールのリンク集合を丸ごと差し替え、他の構造は保持する", async () => {
    const caps = createCaps(reconstructStoredProfile(publishedContent));

    await replaceMyLinks(caps, {
      links: [{ linkTypeCode: "instagram", url: "https://instagram.com/taro" }],
    });

    const saved = toPersistence(caps.artistProfiles.save.mock.calls[0][0]);
    expect(saved.id).toBe("profile-existing");
    expect(saved.links).toEqual([
      { linkTypeCode: "instagram", url: "https://instagram.com/taro" },
    ]);
    expect(saved.name).toBe("Taro");
    expect(saved.chapters).toEqual([
      { questionCode: "beginning", body: "私の歩み" },
    ]);
    expect(saved.published).toBe(true);
  });

  it("公開中にリンクを全て消したら下書きに落として保存する", async () => {
    const caps = createCaps(reconstructStoredProfile(publishedContent));

    const result = await replaceMyLinks(caps, { links: [] });

    expect(caps.artistProfiles.save.mock.calls[0][0].kind).toBe("draft");
    expect(result).toStrictEqual({ ok: true, value: { links: [] } });
  });

  it("不正な url は err(InvalidSnsUrlFormatError)（参照も保存もしない）", async () => {
    const caps = createCaps();

    const result = await replaceMyLinks(caps, {
      links: [{ linkTypeCode: "x", url: "not-a-url" }],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidSnsUrlFormatError");
    }
    expect(caps.artistProfiles.load).not.toHaveBeenCalled();
    expect(caps.artistProfiles.save).not.toHaveBeenCalled();
  });
});
