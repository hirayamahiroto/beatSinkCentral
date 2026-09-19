import { describe, it, expect, vi, beforeEach } from "vitest";
import { choosePresentationPattern } from "./index";
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

const existingProfile = reconstructArtistProfile({
  id: "profile-existing",
  artistId: "artist-1",
  published: true,
  name: "Taro",
  imageUrl: "https://example.com/taro.png",
  chapters: [{ questionCode: "beginning", body: "私の歩み" }],
  genres: ["bass"],
  links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
  presentationPatternCode: "interview",
});

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

describe("choosePresentationPattern", () => {
  beforeEach(() => vi.clearAllMocks());

  it("プロフィール未作成なら下書きを作ってパターンを保存し、presentation だけを返す", async () => {
    const caps = createCaps();

    const result = await choosePresentationPattern(caps, {
      patternCode: "editorial",
    });

    expect(result).toStrictEqual({
      ok: true,
      value: { presentation: { patternCode: "editorial" } },
    });
    const persisted = caps.artistProfiles.upsert.mock.calls[0][0];
    expect(persisted.artistId).toBe("artist-1");
    expect(persisted.presentationPatternCode).toBe("editorial");
    expect(persisted.published).toBe(false);
  });

  it("既存プロフィールの他の構造には触らずパターンだけを差し替える", async () => {
    const caps = createCaps();
    caps.artistProfiles.findByArtistId.mockResolvedValue(existingProfile);

    const result = await choosePresentationPattern(caps, {
      patternCode: "spotlight",
    });

    expect(result.ok).toBe(true);
    expect(caps.artistProfiles.upsert).toHaveBeenCalledExactlyOnceWith({
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
    expect(caps.artistProfiles.upsert).not.toHaveBeenCalled();
  });
});
