import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateMyAttributes } from "./index";
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

describe("updateMyAttributes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("プロフィール未作成なら下書きを作って属性を保存し、attributes だけを返す", async () => {
    const caps = createCaps();

    const result = await updateMyAttributes(caps, {
      name: "Taro",
      tagline: "音で旅する",
      genres: ["bass", "inward"],
      activityInfo: "東京 / ソロ",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toStrictEqual({
        attributes: {
          name: "Taro",
          imageUrl: null,
          tagline: "音で旅する",
          genres: ["bass", "inward"],
          activityInfo: "東京 / ソロ",
        },
      });
    }
    const persisted = caps.artistProfiles.upsert.mock.calls[0][0];
    expect(persisted.artistId).toBe("artist-1");
    expect(persisted.published).toBe(false);
  });

  it("既存プロフィールがある場合は ID・画像・章・リンク・公開状態を保持して属性だけ更新する", async () => {
    const caps = createCaps();
    caps.artistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile(publishedContent),
    );

    await updateMyAttributes(caps, { name: "New Name", genres: ["loop"] });

    expect(caps.artistProfiles.findByArtistId).toHaveBeenCalledWith("artist-1");
    const persisted = caps.artistProfiles.upsert.mock.calls[0][0];
    expect(persisted).toStrictEqual({
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

  it("公開中の更新で公開条件を割ったら非公開へ降ろして保存する", async () => {
    const caps = createCaps();
    caps.artistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile(publishedContent),
    );

    const result = await updateMyAttributes(caps, { name: null });

    expect(caps.artistProfiles.upsert.mock.calls[0][0].published).toBe(false);
    expect(result.ok).toBe(true);
  });

  it("不正な name は err(InvalidProfileNameFormatError)（参照も保存もしない）", async () => {
    const caps = createCaps();

    const result = await updateMyAttributes(caps, { name: "a".repeat(256) });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidProfileNameFormatError");
    }
    expect(caps.artistProfiles.findByArtistId).not.toHaveBeenCalled();
    expect(caps.artistProfiles.upsert).not.toHaveBeenCalled();
  });
});
