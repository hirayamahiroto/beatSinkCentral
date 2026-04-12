import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createUserUseCase } from "./index";
import { isUserAlreadyRegisteredError } from "./errors";
import { IUserRepository } from "../../../domain/users/repositories";
import * as FactoriesModule from "../../../domain/users/factories";
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

      expect(result.userId).toBe(generatedId);
    });

    it("findBySubが呼ばれる", async () => {
      const mockRepository = createMockRepository();
      const savedUser = reconstructUser({
        id: "generated-id",
        subId: validInput.subId,
        email: validInput.email,
      });
      mockRepository.findBySub.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(savedUser);

      await createUserUseCase(
        validInput,
        mockRepository as unknown as IUserRepository
      );

      expect(mockRepository.findBySub).toHaveBeenCalledWith(validInput.subId);
    });

    it("createUserが正しいパラメータで呼ばれる", async () => {
      const mockRepository = createMockRepository();
      const createUserSpy = vi.spyOn(FactoriesModule, "createUser");
      const savedUser = reconstructUser({
        id: "generated-id",
        subId: validInput.subId,
        email: validInput.email,
      });
      mockRepository.findBySub.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(savedUser);

      await createUserUseCase(
        validInput,
        mockRepository as unknown as IUserRepository
      );

      expect(createUserSpy).toHaveBeenCalledWith({
        subId: validInput.subId,
        email: validInput.email,
      });
    });

    it("saveがpersistenceデータを受け取って呼ばれる", async () => {
      const mockRepository = createMockRepository();
      const savedUser = reconstructUser({
        id: "generated-id",
        subId: validInput.subId,
        email: validInput.email,
      });
      mockRepository.findBySub.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(savedUser);

      await createUserUseCase(
        validInput,
        mockRepository as unknown as IUserRepository
      );

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const savedData = mockRepository.save.mock.calls[0][0];
      expect(savedData).toStrictEqual({
        id: expect.any(String),
        subId: validInput.subId,
        email: validInput.email,
      });
    });
  });

  describe("既存ユーザー", () => {
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

    it("既存ユーザーの場合はsaveが呼ばれない", async () => {
      const mockRepository = createMockRepository();
      const existingUser = reconstructUser({
        id: "existing-user-id",
        subId: validInput.subId,
        email: validInput.email,
      });
      mockRepository.findBySub.mockResolvedValue(existingUser);

      await createUserUseCase(
        validInput,
        mockRepository as unknown as IUserRepository
      ).catch(() => {});

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("既存ユーザーの場合はcreateUserが呼ばれない", async () => {
      const mockRepository = createMockRepository();
      const createUserSpy = vi.spyOn(FactoriesModule, "createUser");
      const existingUser = reconstructUser({
        id: "existing-user-id",
        subId: validInput.subId,
        email: validInput.email,
      });
      mockRepository.findBySub.mockResolvedValue(existingUser);

      await createUserUseCase(
        validInput,
        mockRepository as unknown as IUserRepository
      ).catch(() => {});

      expect(createUserSpy).not.toHaveBeenCalled();
    });
  });
});
