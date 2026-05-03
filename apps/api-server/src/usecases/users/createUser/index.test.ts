import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createUserUseCase,
  type CreateUserDeps,
  type CreateUserInput,
} from "./index";
import { isUserAlreadyRegisteredError } from "../../../domain/users/policies/assertNotRegistered";
import { isAccountIdAlreadyTakenError } from "../../../domain/artists/policies/assertAccountIdAvailable";
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
      findByAccountId: vi.fn(),
    },
    txRunner: {
      run: vi.fn(async (fn) => fn({} as Parameters<typeof fn>[0])),
    },
  } satisfies CreateUserDeps;
  return deps;
};

const validInput = {
  subId: "auth0|123456789",
  email: "test@example.com",
  accountId: "test_account",
} satisfies CreateUserInput;

describe("createUserUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("新規ユーザーを作成してuserIdとartistIdを返す", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(null);
    deps.artistRepository.findByAccountId.mockResolvedValue(null);
    deps.userRepository.save.mockResolvedValue(undefined);
    deps.artistRepository.save.mockResolvedValue(undefined);

    const result = await createUserUseCase(validInput, deps);

    expect(typeof result.userId).toBe("string");
    expect(typeof result.artistId).toBe("string");
    expect(deps.userRepository.save).toHaveBeenCalledTimes(1);
    expect(deps.artistRepository.save).toHaveBeenCalledTimes(1);
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
    deps.artistRepository.findByAccountId.mockResolvedValue(null);

    const promise = createUserUseCase(validInput, deps);

    await expect(promise).rejects.toSatisfy(isUserAlreadyRegisteredError);
    expect(deps.userRepository.save).not.toHaveBeenCalled();
    expect(deps.artistRepository.save).not.toHaveBeenCalled();
  });

  it("AccountIdが既に取られている場合はAccountIdAlreadyTakenErrorをスローする", async () => {
    const deps = createMockDeps();
    const existingArtist = reconstructArtist({
      artistId: "existing-artist-id",
      accountId: validInput.accountId,
      ownerUserId: "other-user-id",
      profile: null,
    });
    deps.userRepository.findBySub.mockResolvedValue(null);
    deps.artistRepository.findByAccountId.mockResolvedValue(existingArtist);

    const promise = createUserUseCase(validInput, deps);

    await expect(promise).rejects.toSatisfy(isAccountIdAlreadyTakenError);
    expect(deps.userRepository.save).not.toHaveBeenCalled();
    expect(deps.artistRepository.save).not.toHaveBeenCalled();
  });

  it("findBySub と findByAccountId は同一トランザクション内で実行される", async () => {
    const deps = createMockDeps();
    const txContext = { __tx: "marker" };
    deps.txRunner.run.mockImplementation(async (fn) => fn(txContext as never));
    deps.userRepository.findBySub.mockResolvedValue(null);
    deps.artistRepository.findByAccountId.mockResolvedValue(null);
    deps.userRepository.save.mockResolvedValue(undefined);
    deps.artistRepository.save.mockResolvedValue(undefined);

    await createUserUseCase(validInput, deps);

    expect(deps.userRepository.findBySub).toHaveBeenCalledWith(
      validInput.subId,
      txContext,
    );
    expect(deps.artistRepository.findByAccountId).toHaveBeenCalledWith(
      validInput.accountId,
      txContext,
    );
    expect(deps.userRepository.save).toHaveBeenCalledWith(
      expect.anything(),
      txContext,
    );
    expect(deps.artistRepository.save).toHaveBeenCalledWith(
      expect.anything(),
      txContext,
    );
  });
});
