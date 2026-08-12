import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createUserUseCase,
  type CreateUserDeps,
  type CreateUserInput,
} from "./index";
import { isUserAlreadyRegisteredError } from "../../../domain/users/errors/userAlreadyRegistered";
import {
  createAccountIdAlreadyTakenError,
  isAccountIdAlreadyTakenError,
} from "../../../domain/artists/errors/accountIdAlreadyTaken";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";

const createMockDeps = () => {
  const deps = {
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

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(typeof result.value.userId).toBe("string");
      expect(typeof result.value.artistId).toBe("string");
    }
    expect(deps.userRepository.save).toHaveBeenCalledTimes(1);
    expect(deps.artistRepository.save).toHaveBeenCalledTimes(1);
    expect(deps.txRunner.run).toHaveBeenCalledTimes(1);
  });

  it("既存ユーザーの場合はUserAlreadyRegisteredErrorをerrで返す", async () => {
    const deps = createMockDeps();
    const existingUser = reconstructUser({
      id: "existing-user-id",
      subId: validInput.subId,
      email: validInput.email,
    });
    deps.userRepository.findBySub.mockResolvedValue(existingUser);
    deps.artistRepository.findByAccountId.mockResolvedValue(null);

    const result = await createUserUseCase(validInput, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isUserAlreadyRegisteredError(result.error)).toBe(true);
    }
    expect(deps.userRepository.save).not.toHaveBeenCalled();
    expect(deps.artistRepository.save).not.toHaveBeenCalled();
  });

  it("AccountIdが既に取られている場合はAccountIdAlreadyTakenErrorをerrで返す", async () => {
    const deps = createMockDeps();
    const existingArtist = reconstructArtist({
      artistId: "existing-artist-id",
      accountId: validInput.accountId,
      ownerUserId: "other-user-id",
      profile: null,
    });
    deps.userRepository.findBySub.mockResolvedValue(null);
    deps.artistRepository.findByAccountId.mockResolvedValue(existingArtist);

    const result = await createUserUseCase(validInput, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isAccountIdAlreadyTakenError(result.error)).toBe(true);
    }
    expect(deps.userRepository.save).not.toHaveBeenCalled();
    expect(deps.artistRepository.save).not.toHaveBeenCalled();
  });

  it("emailが不正な場合は保存せずInvalidEmailFormatErrorをerrで返す", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(null);
    deps.artistRepository.findByAccountId.mockResolvedValue(null);

    const result = await createUserUseCase(
      { ...validInput, email: "invalid" },
      deps,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidEmailFormatError");
    }
    expect(deps.userRepository.save).not.toHaveBeenCalled();
    expect(deps.artistRepository.save).not.toHaveBeenCalled();
  });

  it("並行登録で保存時に一意制約違反が起きた場合はAccountIdAlreadyTakenErrorをerrで返す", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(null);
    deps.artistRepository.findByAccountId.mockResolvedValue(null);
    deps.userRepository.save.mockResolvedValue(undefined);
    deps.artistRepository.save.mockRejectedValue(
      createAccountIdAlreadyTakenError(validInput.accountId),
    );

    const result = await createUserUseCase(validInput, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isAccountIdAlreadyTakenError(result.error)).toBe(true);
    }
  });

  it("一意制約違反以外の例外はそのまま伝播する", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(null);
    deps.artistRepository.findByAccountId.mockResolvedValue(null);
    deps.userRepository.save.mockResolvedValue(undefined);
    const connectionError = new Error("connection terminated");
    deps.artistRepository.save.mockRejectedValue(connectionError);

    await expect(createUserUseCase(validInput, deps)).rejects.toBe(
      connectionError,
    );
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
