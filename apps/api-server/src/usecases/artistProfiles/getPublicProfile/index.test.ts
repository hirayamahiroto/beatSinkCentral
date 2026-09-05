import { describe, it, expect, vi, beforeEach } from "vitest";
import { reconstructArtistProfile } from "../../../domain/artistProfiles/factories";
import { getPublicProfile } from "./index";
import type { IArtistProfileReader } from "../../../domain/artistProfiles/repositories";
import type { PublicReadCapabilities } from "../../capabilities";

const createCaps = () =>
  ({
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
    },
  }) satisfies Pick<PublicReadCapabilities, "artistProfiles">;

describe("getPublicProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("公開プロフィールを ok(handle, view) で返す", async () => {
    const caps = createCaps();
    caps.artistProfiles.findPublishedByHandle.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: true,
        name: "Taro",
      }),
    );

    const result = await getPublicProfile(caps, {
      handle: "beatboxer_taro",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.handle).toBe("beatboxer_taro");
      expect(result.value.profile.attributes.name).toBe("Taro");
      expect(result.value.profile.published).toBe(true);
    }
    expect(caps.artistProfiles.findPublishedByHandle).toHaveBeenCalledWith(
      "beatboxer_taro",
    );
  });

  it("非公開・未作成・存在しない handle は err(ArtistProfileNotFoundError)", async () => {
    const caps = createCaps();

    const result = await getPublicProfile(caps, { handle: "unknown" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("ArtistProfileNotFoundError");
    }
  });

  it("書式不正な handle は参照せず InvalidHandleFormatError を err で返す", async () => {
    const caps = createCaps();

    const result = await getPublicProfile(caps, { handle: "not an id" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidHandleFormatError");
    }
    expect(caps.artistProfiles.findPublishedByHandle).not.toHaveBeenCalled();
  });

  it("255 文字を超える handle は参照せず err で返す", async () => {
    const caps = createCaps();

    const result = await getPublicProfile(caps, { handle: "a".repeat(256) });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidHandleFormatError");
    }
    expect(caps.artistProfiles.findPublishedByHandle).not.toHaveBeenCalled();
  });

  it("前後の空白を落とした handle で参照し、その値を返す", async () => {
    const caps = createCaps();
    caps.artistProfiles.findPublishedByHandle.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: true,
        name: "Taro",
      }),
    );

    const result = await getPublicProfile(caps, {
      handle: "  beatboxer_taro  ",
    });

    expect(caps.artistProfiles.findPublishedByHandle).toHaveBeenCalledWith(
      "beatboxer_taro",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.handle).toBe("beatboxer_taro");
    }
  });
});
