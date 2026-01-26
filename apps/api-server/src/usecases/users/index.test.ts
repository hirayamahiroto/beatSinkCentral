import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createUserUseCase } from "./index";
import { IUserRepository } from "../../domain/users/repositories";
import * as FactoriesModule from "../../domain/users/factories";

const createMockRepository = () => ({
  save: vi.fn(),
  findUserIdBySub: vi.fn(),
});

const validInput = {
  accountId: "acc_123456789",
  sub: "auth0|123456789",
  email: "test@example.com",
  name: "testuser",
};

describe("createUserUseCase", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("新規ユーザー作成", () => {
    it("新規ユーザーを作成してuserIdを返す", async () => {
      const mockRepository = createMockRepository();
      const generatedId = "550e8400-e29b-41d4-a716-446655440000";
      mockRepository.findUserIdBySub.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(generatedId);

      const result = await createUserUseCase(
        validInput,
        mockRepository as IUserRepository
      );

      expect(result.userId).toBe(generatedId);
    });

    it("findUserIdBySubが呼ばれる", async () => {
      const mockRepository = createMockRepository();
      mockRepository.findUserIdBySub.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue("generated-id");

      await createUserUseCase(validInput, mockRepository as IUserRepository);

      expect(mockRepository.findUserIdBySub).toHaveBeenCalledWith(
        validInput.sub
      );
    });

    it("createUserが正しいパラメータで呼ばれる", async () => {
      const mockRepository = createMockRepository();
      const createUserSpy = vi.spyOn(FactoriesModule, "createUser");
      mockRepository.findUserIdBySub.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue("generated-id");

      await createUserUseCase(validInput, mockRepository as IUserRepository);

      expect(createUserSpy).toHaveBeenCalledWith({
        accountId: validInput.accountId,
        sub: validInput.sub,
        email: validInput.email,
        name: validInput.name,
      });
    });

    it("saveがUserオブジェクトを受け取って呼ばれる", async () => {
      const mockRepository = createMockRepository();
      mockRepository.findUserIdBySub.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue("generated-id");

      await createUserUseCase(validInput, mockRepository as IUserRepository);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const savedUser = mockRepository.save.mock.calls[0][0];
      expect(savedUser.toJSON()).toStrictEqual({
        accountId: validInput.accountId,
        sub: validInput.sub,
        email: validInput.email,
        name: validInput.name,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      });
    });
  });

  describe("既存ユーザー（冪等性）", () => {
    it("既存ユーザーの場合は既存のuserIdを返す", async () => {
      const mockRepository = createMockRepository();
      const existingUserId = "existing-user-id";
      mockRepository.findUserIdBySub.mockResolvedValue(existingUserId);

      const result = await createUserUseCase(
        validInput,
        mockRepository as IUserRepository
      );

      expect(result.userId).toBe(existingUserId);
    });

    it("既存ユーザーの場合はsaveが呼ばれない", async () => {
      const mockRepository = createMockRepository();
      mockRepository.findUserIdBySub.mockResolvedValue("existing-user-id");

      await createUserUseCase(validInput, mockRepository as IUserRepository);

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("既存ユーザーの場合はcreateUserが呼ばれない", async () => {
      const mockRepository = createMockRepository();
      const createUserSpy = vi.spyOn(FactoriesModule, "createUser");
      mockRepository.findUserIdBySub.mockResolvedValue("existing-user-id");

      await createUserUseCase(validInput, mockRepository as IUserRepository);

      expect(createUserSpy).not.toHaveBeenCalled();
    });
  });
});
