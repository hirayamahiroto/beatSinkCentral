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

  it("公開プロフィールを accountId と view で返す", async () => {
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
        snsLinks: ["https://x.com/taro"],
      }),
    );

    const result = await getPublicProfileUseCase(
      { accountId: "beatboxer_taro" },
      deps,
    );

    expect(result.accountId).toBe("beatboxer_taro");
    expect(result.profile.name).toBe("Taro");
    expect(result.profile.published).toBe(true);
    expect(
      deps.artistProfileRepository.findPublishedByAccountId,
    ).toHaveBeenCalledWith("beatboxer_taro");
  });

  it("非公開・未作成・存在しない accountId は ArtistProfileNotFoundError（404）", async () => {
    const deps = createMockDeps();
    deps.artistProfileRepository.findPublishedByAccountId.mockResolvedValue(
      null,
    );

    await expect(
      getPublicProfileUseCase({ accountId: "unknown" }, deps),
    ).rejects.toSatisfy(isArtistProfileNotFoundError);
  });
});
