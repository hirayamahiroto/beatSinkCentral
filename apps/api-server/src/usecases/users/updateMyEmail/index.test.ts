import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  updateMyEmailUseCase,
  type UpdateMyEmailDeps,
  type UpdateMyEmailInput,
} from "./index";
import { isUserNotFoundError } from "../../../domain/users/policies/assertRegistered";
import { reconstructUser } from "../../../domain/users/factories";

const createMockDeps = () => {
  const deps = {
    userRepository: {
      save: vi.fn(),
      findBySub: vi.fn(),
      updateEmail: vi.fn(),
    },
    txRunner: {
      run: vi.fn(async (fn) => fn({} as Parameters<typeof fn>[0])),
    },
  } satisfies UpdateMyEmailDeps;
  return deps;
};

const validInput = {
  subId: "auth0|123456789",
  email: "new@example.com",
} satisfies UpdateMyEmailInput;

describe("updateMyEmailUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("既存ユーザーのemailを更新し、新しいemailを返す", async () => {
    const deps = createMockDeps();
    const existingUser = reconstructUser({
      id: "550e8400-e29b-41d4-a716-446655440000",
      subId: validInput.subId,
      email: "old@example.com",
    });
    deps.userRepository.findBySub.mockResolvedValue(existingUser);
    deps.userRepository.updateEmail.mockResolvedValue(
      reconstructUser({
        id: existingUser.getId(),
        subId: existingUser.getSub(),
        email: validInput.email,
      }),
    );

    const result = await updateMyEmailUseCase(validInput, deps);

    expect(result).toStrictEqual({
      userId: existingUser.getId(),
      email: validInput.email,
    });
    expect(deps.userRepository.updateEmail).toHaveBeenCalledWith(
      { id: existingUser.getId(), email: validInput.email },
      expect.anything(),
    );
    expect(deps.txRunner.run).toHaveBeenCalledTimes(1);
  });

  it("ユーザーが存在しない場合はUserNotFoundErrorをスローする", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(null);

    const promise = updateMyEmailUseCase(validInput, deps);

    await expect(promise).rejects.toSatisfy(isUserNotFoundError);
    expect(deps.userRepository.updateEmail).not.toHaveBeenCalled();
  });

  it("emailが不正な形式の場合は、トランザクション開始前にInvalidEmailFormatErrorをスローする", async () => {
    const deps = createMockDeps();

    const promise = updateMyEmailUseCase(
      { ...validInput, email: "invalid" },
      deps,
    );

    await expect(promise).rejects.toMatchObject({
      type: "InvalidEmailFormatError",
    });
    expect(deps.txRunner.run).not.toHaveBeenCalled();
    expect(deps.userRepository.findBySub).not.toHaveBeenCalled();
    expect(deps.userRepository.updateEmail).not.toHaveBeenCalled();
  });
});
