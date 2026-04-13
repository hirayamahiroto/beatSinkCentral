import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUserUseCase } from "./index";
import { isUserAlreadyRegisteredError } from "./errors";
import { reconstructUser } from "../../../domain/users/factories";
import type { IUserRepository } from "../../../domain/users/repositories";
import type { IArtistRepository } from "../../../domain/artists/repositories";
import type { IArtistOwnerRepository } from "../../../domain/artistOwners/repositories";
import type { ITransactionRunner } from "../../../infrastructure/transaction";

const createMockDeps = () => {
  const userRepository = {
    save: vi.fn(),
    findBySub: vi.fn(),
  } satisfies IUserRepository;
  const artistRepository = {
    save: vi.fn(),
    findByUserId: vi.fn(),
  } satisfies IArtistRepository;
  const artistOwnerRepository = {
    save: vi.fn(),
  } satisfies IArtistOwnerRepository;
  const txRunner = {
    run: vi.fn(async (fn) => fn({} as Parameters<typeof fn>[0])),
  } satisfies ITransactionRunner;
  return { userRepository, artistRepository, artistOwnerRepository, txRunner };
};

const validInput = {
  subId: "auth0|123456789",
  email: "test@example.com",
  accountId: "test_account",
};

describe("createUserUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("新規ユーザーを作成してuserIdとartistIdを返す", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(null);
    deps.userRepository.save.mockResolvedValue(undefined);
    deps.artistRepository.save.mockResolvedValue(undefined);
    deps.artistOwnerRepository.save.mockResolvedValue(undefined);

    const result = await createUserUseCase(validInput, deps);

    expect(typeof result.userId).toBe("string");
    expect(typeof result.artistId).toBe("string");
    expect(deps.userRepository.save).toHaveBeenCalledTimes(1);
    expect(deps.artistRepository.save).toHaveBeenCalledTimes(1);
    expect(deps.artistOwnerRepository.save).toHaveBeenCalledTimes(1);
    expect(deps.txRunner.run).toHaveBeenCalledTimes(1);
  });

  it("既存ユーザーの場合はUserAlreadyRegisteredErrorをスローする", async () => {
    const deps = createMockDeps();
    const existingUser = reconstructUser({
      id: "existing-user-id",
      subId: validInput.subId,
      email: validInput.email,
    });
    deps.userRepository.findBySub.mockResolvedValue(existingUser);

    const promise = createUserUseCase(validInput, deps);

    await expect(promise).rejects.toSatisfy(isUserAlreadyRegisteredError);
    expect(deps.txRunner.run).not.toHaveBeenCalled();
    expect(deps.userRepository.save).not.toHaveBeenCalled();
  });
});
