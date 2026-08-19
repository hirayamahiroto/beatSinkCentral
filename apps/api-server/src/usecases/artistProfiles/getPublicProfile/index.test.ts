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
      findPublishedByAccountId: vi.fn<
        IArtistProfileReader["findPublishedByAccountId"]
      >(async () => null),
      listPublishedSummaries: vi.fn<
        IArtistProfileReader["listPublishedSummaries"]
      >(async () => []),
    },
  }) satisfies Pick<PublicReadCapabilities, "artistProfiles">;

describe("getPublicProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("公開プロフィールを ok(accountId, view) で返す", async () => {
    const caps = createCaps();
    caps.artistProfiles.findPublishedByAccountId.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: true,
        name: "Taro",
      }),
    );

    const result = await getPublicProfile(caps, {
      accountId: "beatboxer_taro",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accountId).toBe("beatboxer_taro");
      expect(result.value.profile.name).toBe("Taro");
      expect(result.value.profile.published).toBe(true);
    }
    expect(caps.artistProfiles.findPublishedByAccountId).toHaveBeenCalledWith(
      "beatboxer_taro",
    );
  });

  it("非公開・未作成・存在しない accountId は err(ArtistProfileNotFoundError)", async () => {
    const caps = createCaps();

    const result = await getPublicProfile(caps, { accountId: "unknown" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("ArtistProfileNotFoundError");
    }
  });

  it("書式不正な accountId は参照せず InvalidAccountIdFormatError を err で返す", async () => {
    const caps = createCaps();

    const result = await getPublicProfile(caps, { accountId: "not an id" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidAccountIdFormatError");
    }
    expect(caps.artistProfiles.findPublishedByAccountId).not.toHaveBeenCalled();
  });

  it("255 文字を超える accountId は参照せず err で返す", async () => {
    const caps = createCaps();

    const result = await getPublicProfile(caps, { accountId: "a".repeat(256) });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidAccountIdFormatError");
    }
    expect(caps.artistProfiles.findPublishedByAccountId).not.toHaveBeenCalled();
  });

  it("前後の空白を落とした accountId で参照し、その値を返す", async () => {
    const caps = createCaps();
    caps.artistProfiles.findPublishedByAccountId.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: true,
        name: "Taro",
      }),
    );

    const result = await getPublicProfile(caps, {
      accountId: "  beatboxer_taro  ",
    });

    expect(caps.artistProfiles.findPublishedByAccountId).toHaveBeenCalledWith(
      "beatboxer_taro",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accountId).toBe("beatboxer_taro");
    }
  });
});
