import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMeUseCase } from "./index";
import type { IUserRepository } from "../../../domain/users/repositories";
import type { IArtistRepository } from "../../../domain/artists/repositories";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";

const createUserRepo = () => ({
  save: vi.fn(),
  findBySub: vi.fn(),
});

const createArtistRepo = () => ({
  findByUserId: vi.fn(),
});

describe("getMeUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ユーザーが未登録の場合はregistered:falseを返す", async () => {
    const userRepo = createUserRepo();
    const artistRepo = createArtistRepo();
    userRepo.findBySub.mockResolvedValue(null);

    const result = await getMeUseCase(
      "auth0|unknown",
      userRepo as unknown as IUserRepository,
      artistRepo as unknown as IArtistRepository
    );

    expect(result).toStrictEqual({ registered: false });
    expect(artistRepo.findByUserId).not.toHaveBeenCalled();
  });

  it("ユーザーが登録済みでartist未紐付けの場合はartist:nullを返す", async () => {
    const userRepo = createUserRepo();
    const artistRepo = createArtistRepo();
    const user = reconstructUser({
      id: "user-1",
      subId: "auth0|123",
      email: "test@example.com",
    });
    userRepo.findBySub.mockResolvedValue(user);
    artistRepo.findByUserId.mockResolvedValue(null);

    const result = await getMeUseCase(
      "auth0|123",
      userRepo as unknown as IUserRepository,
      artistRepo as unknown as IArtistRepository
    );

    expect(result).toStrictEqual({
      registered: true,
      userId: "user-1",
      email: "test@example.com",
      artist: null,
    });
  });

  it("ユーザーとartistが揃っている場合はartist情報を返す", async () => {
    const userRepo = createUserRepo();
    const artistRepo = createArtistRepo();
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
    userRepo.findBySub.mockResolvedValue(user);
    artistRepo.findByUserId.mockResolvedValue(artist);

    const result = await getMeUseCase(
      "auth0|123",
      userRepo as unknown as IUserRepository,
      artistRepo as unknown as IArtistRepository
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
