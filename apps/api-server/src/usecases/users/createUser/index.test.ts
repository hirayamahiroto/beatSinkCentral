import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUserUseCase } from "./index";
import { isUserAlreadyRegisteredError } from "./errors";
import type { IUserRepository } from "../../../domain/users/repositories";
import { reconstructUser } from "../../../domain/users/factories";

const createMockRepository = () => ({
  save: vi.fn(),
  findBySub: vi.fn(),
});

const validInput = {
  subId: "auth0|123456789",
  email: "test@example.com",
};

describe("createUserUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("新規ユーザーを作成してuserIdを返す", async () => {
    const mockRepository = createMockRepository();
    const generatedId = "550e8400-e29b-41d4-a716-446655440000";
    const savedUser = reconstructUser({
      id: generatedId,
      subId: validInput.subId,
      email: validInput.email,
    });
    mockRepository.findBySub.mockResolvedValue(null);
    mockRepository.save.mockResolvedValue(savedUser);

    const result = await createUserUseCase(
      validInput,
      mockRepository as unknown as IUserRepository
    );

    expect(result).toStrictEqual({ userId: generatedId });
  });

  it("既存ユーザーの場合はUserAlreadyRegisteredErrorをスローする", async () => {
    const mockRepository = createMockRepository();
    const existingUser = reconstructUser({
      id: "existing-user-id",
      subId: validInput.subId,
      email: validInput.email,
    });
    mockRepository.findBySub.mockResolvedValue(existingUser);

    const promise = createUserUseCase(
      validInput,
      mockRepository as unknown as IUserRepository
    );

    await expect(promise).rejects.toSatisfy(isUserAlreadyRegisteredError);
  });
});
