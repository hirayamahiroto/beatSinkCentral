import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPublicProfileUseCase, type GetPublicProfileDeps } from "./index";
import { isArtistProfileNotFoundError } from "../../../domain/artistProfiles/policies/assertArtistProfileExists";
import { reconstructArtistProfile } from "../../../domain/artistProfiles/factories";

const createMockDeps = () =>
  ({
    artistProfileRepository: {
      findByArtistId: vi.fn(),
      findPublishedByAccountId: vi.fn(),
      upsert: vi.fn(),
      setPublished: vi.fn(),
    },
  }) satisfies GetPublicProfileDeps;

describe("getPublicProfileUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("公開プロフィールを ok(accountId, view) で返す", async () => {
    const deps = createMockDeps();
    deps.artistProfileRepository.findPublishedByAccountId.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: true,
        name: "Taro",
        imageUrl: "https://example.com/a.png",
        story: "私の歩み",
        genres: ["bass"],
        links: [{ type: "x", url: "https://x.com/taro" }],
      }),
    );

    const result = await getPublicProfileUseCase(
      { accountId: "beatboxer_taro" },
      deps,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accountId).toBe("beatboxer_taro");
      expect(result.value.profile.name).toBe("Taro");
      expect(result.value.profile.published).toBe(true);
    }
    expect(
      deps.artistProfileRepository.findPublishedByAccountId,
    ).toHaveBeenCalledWith("beatboxer_taro");
  });

  it("非公開・未作成・存在しない accountId は err(ArtistProfileNotFoundError)", async () => {
    const deps = createMockDeps();
    deps.artistProfileRepository.findPublishedByAccountId.mockResolvedValue(
      null,
    );

    const result = await getPublicProfileUseCase(
      { accountId: "unknown" },
      deps,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isArtistProfileNotFoundError(result.error)).toBe(true);
    }
  });
});
