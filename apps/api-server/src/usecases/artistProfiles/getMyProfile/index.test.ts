import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMyProfileUseCase, type GetMyProfileDeps } from "./index";
import { isUserNotFoundError } from "../../../domain/users/policies/assertRegistered";
import { isArtistNotFoundError } from "../../../domain/artists/policies/assertArtistExists";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../domain/artistProfiles/factories";

const createMockDeps = () =>
  ({
    userRepository: {
      save: vi.fn(),
      findBySub: vi.fn(),
      updateEmail: vi.fn(),
    },
    artistRepository: {
      save: vi.fn(),
      findByUserId: vi.fn(),
      findByAccountId: vi.fn(),
      updateAccountId: vi.fn(),
    },
    artistProfileRepository: {
      findByArtistId: vi.fn(),
      findPublishedByAccountId: vi.fn(),
      upsert: vi.fn(),
      setPublished: vi.fn(),
    },
  }) satisfies GetMyProfileDeps;

const existingUser = reconstructUser({
  id: "550e8400-e29b-41d4-a716-446655440000",
  subId: "auth0|123456789",
  email: "test@example.com",
});

const existingArtist = reconstructArtist({
  artistId: "artist-1",
  accountId: "beatboxer_taro",
  ownerUserId: existingUser.getId(),
  profile: null,
});

describe("getMyProfileUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("プロフィール未作成なら profile: null を返す", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(existingUser);
    deps.artistRepository.findByUserId.mockResolvedValue(existingArtist);
    deps.artistProfileRepository.findByArtistId.mockResolvedValue(null);

    const result = await getMyProfileUseCase(
      { subId: existingUser.getSub() },
      deps,
    );

    expect(result).toEqual({ accountId: "beatboxer_taro", profile: null });
  });

  it("下書きを含む profile を view で返す", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(existingUser);
    deps.artistRepository.findByUserId.mockResolvedValue(existingArtist);
    deps.artistProfileRepository.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: false,
        name: "Taro",
        genres: ["bass"],
      }),
    );

    const result = await getMyProfileUseCase(
      { subId: existingUser.getSub() },
      deps,
    );

    expect(result.accountId).toBe("beatboxer_taro");
    expect(result.profile?.name).toBe("Taro");
    expect(result.profile?.published).toBe(false);
  });

  it("ユーザー未登録なら UserNotFoundError", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(null);

    await expect(
      getMyProfileUseCase({ subId: "auth0|unknown" }, deps),
    ).rejects.toSatisfy(isUserNotFoundError);
  });

  it("artist が無ければ ArtistNotFoundError", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(existingUser);
    deps.artistRepository.findByUserId.mockResolvedValue(null);

    await expect(
      getMyProfileUseCase({ subId: existingUser.getSub() }, deps),
    ).rejects.toSatisfy(isArtistNotFoundError);
  });
});
