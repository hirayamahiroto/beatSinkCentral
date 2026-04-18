import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMeUseCase, type GetMeDeps, type GetMeInput } from "./index";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";

const createMockDeps = () => {
  const deps = {
    userRepository: {
      save: vi.fn(),
      findBySub: vi.fn(),
    },
    artistRepository: {
      save: vi.fn(),
      findByUserId: vi.fn(),
    },
  } satisfies GetMeDeps;
  return deps;
};

describe("getMeUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ユーザーが未登録の場合はregistered:falseを返す", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(null);

    const input = { subId: "auth0|unknown" } satisfies GetMeInput;
    const result = await getMeUseCase(input, deps);

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

    const input = { subId: "auth0|123" } satisfies GetMeInput;
    const result = await getMeUseCase(input, deps);

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
      ownerUserId: "user-1",
      profile: { name: "Test" },
    });
    deps.userRepository.findBySub.mockResolvedValue(user);
    deps.artistRepository.findByUserId.mockResolvedValue(artist);

    const input = { subId: "auth0|123" } satisfies GetMeInput;
    const result = await getMeUseCase(input, deps);

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
