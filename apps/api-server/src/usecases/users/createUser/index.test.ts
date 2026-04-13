import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createUserUseCase,
  type CreateUserDeps,
  type CreateUserInput,
} from "./index";
import { isUserAlreadyRegisteredError } from "./errors";
import { reconstructUser } from "../../../domain/users/factories";

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

    const promise = createUserUseCase(validInput, deps);

    await expect(promise).rejects.toSatisfy(isUserAlreadyRegisteredError);
    expect(deps.txRunner.run).not.toHaveBeenCalled();
    expect(deps.userRepository.save).not.toHaveBeenCalled();
  });
});
