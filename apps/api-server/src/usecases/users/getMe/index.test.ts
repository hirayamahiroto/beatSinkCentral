import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMeUseCase } from "./index";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";
import type { IUserRepository } from "../../../domain/users/repositories";
import type { IArtistRepository } from "../../../domain/artists/repositories";

const createMockDeps = () => {
  const userRepository = {
    save: vi.fn(),
    findBySub: vi.fn(),
  } satisfies IUserRepository;
  const artistRepository = {
    save: vi.fn(),
    findByUserId: vi.fn(),
  } satisfies IArtistRepository;
  return { userRepository, artistRepository };
};

describe("getMeUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ユーザーが未登録の場合はregistered:falseを返す", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(null);

    const result = await getMeUseCase(
      "auth0|unknown",
      deps.userRepository,
      deps.artistRepository
    );

    expect(result).toStrictEqual({ registered: false });
    expect(deps.artistRepository.findByUserId).not.toHaveBeenCalled();
  });

  it("ユーザーが登録済みでartist未紐付けの場合はartist:nullを返す", async () => {
    const deps = createMockDeps();
    const user = reconstructUser({
      id: "user-1",
      subId: "auth0|123",
      email: "test@example.com",
    });
    deps.userRepository.findBySub.mockResolvedValue(user);
    deps.artistRepository.findByUserId.mockResolvedValue(null);

    const result = await getMeUseCase(
      "auth0|123",
      deps.userRepository,
      deps.artistRepository
    );

    expect(result).toStrictEqual({
      registered: true,
      userId: "user-1",
      email: "test@example.com",
      artist: null,
    });
  });

  it("ユーザーとartistが揃っている場合はartist情報を返す", async () => {
    const deps = createMockDeps();
    const user = reconstructUser({
      id: "user-1",
      subId: "auth0|123",
      email: "test@example.com",
    });
    const artist = reconstructArtist({
      artistId: "artist-1",
      accountId: "user_123",
      profile: { name: "Test" },
    });
    deps.userRepository.findBySub.mockResolvedValue(user);
    deps.artistRepository.findByUserId.mockResolvedValue(artist);

    const result = await getMeUseCase(
      "auth0|123",
      deps.userRepository,
      deps.artistRepository
    );

    expect(result).toStrictEqual({
      registered: true,
      userId: "user-1",
      email: "test@example.com",
      artist: {
        artistId: "artist-1",
        accountId: "user_123",
        hasProfile: true,
      },
    });
  });
});
