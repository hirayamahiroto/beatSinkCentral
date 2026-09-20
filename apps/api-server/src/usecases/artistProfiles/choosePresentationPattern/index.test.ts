import { describe, it, expect, vi, beforeEach } from "vitest";
import { choosePresentationPattern } from "./index";
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

const existingProfile = reconstructStoredProfile({
  id: "profile-existing",
  artistId: "artist-1",
  published: true,
  name: "Taro",
  imageUrl: "https://example.com/taro.png",
  chapters: [{ questionCode: "beginning", body: "私の歩み" }],
  genres: ["bass"],
  links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
});

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

describe("choosePresentationPattern", () => {
  beforeEach(() => vi.clearAllMocks());

  it("プロフィール未作成なら下書きを起こしてパターンを保存し、presentation だけを返す", async () => {
    const caps = createCaps();

    const result = await choosePresentationPattern(caps, {
      patternCode: "editorial",
    });

    expect(result).toStrictEqual({
      ok: true,
      value: { presentation: { patternCode: "editorial" } },
    });
    const saved = caps.artistProfiles.save.mock.calls[0][0];
    expect(saved.kind).toBe("draft");
    expect(saved.artistId).toBe("artist-1");
    expect(saved.content.presentationPattern).toBe("editorial");
  });

  it("既存プロフィールの他の構造には触らずパターンだけを差し替える", async () => {
    const caps = createCaps(existingProfile);

    const result = await choosePresentationPattern(caps, {
      patternCode: "spotlight",
    });

    expect(result.ok).toBe(true);
    expect(
      toPersistence(caps.artistProfiles.save.mock.calls[0][0]),
    ).toStrictEqual({
      id: "profile-existing",
      artistId: "artist-1",
      name: "Taro",
      tagline: null,
      imageUrl: "https://example.com/taro.png",
      chapters: [{ questionCode: "beginning", body: "私の歩み" }],
      activityInfo: null,
      genres: ["bass"],
      links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
      presentationPatternCode: "spotlight",
      published: true,
    });
  });

  it("未知のパターンは InvalidPresentationPatternError で拒否し、保存しない", async () => {
    const caps = createCaps();

    const result = await choosePresentationPattern(caps, {
      patternCode: "carousel",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidPresentationPatternError");
    }
    expect(caps.artistProfiles.save).not.toHaveBeenCalled();
  });
});
