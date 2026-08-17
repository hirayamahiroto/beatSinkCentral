import { describe, it, expect, vi, beforeEach } from "vitest";
import { reconstructArtistProfile } from "../../../domain/artistProfiles/factories";
import { getPublicProfile } from "./index";
import { isArtistProfileNotFoundError } from "../../../domain/artistProfiles/errors/artistProfileNotFound";
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
      expect(isArtistProfileNotFoundError(result.error)).toBe(true);
    }
  });
});
