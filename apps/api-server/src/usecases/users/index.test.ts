import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateUserUseCase } from "./index";
import { IUserRepository } from "../../domain/users/repositories";
import * as EntitiesModule from "../../domain/users/entities";

describe("CreateUserUseCase", () => {
  let useCase: CreateUserUseCase;
  let mockRepository: {
    save: ReturnType<typeof vi.fn>;
    findUserIdBySub: ReturnType<typeof vi.fn>;
  };

  const validInput = {
    accountId: "acc_123456789",
    sub: "auth0|123456789",
    email: "test@example.com",
    name: "testuser",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepository = {
      save: vi.fn(),
      findUserIdBySub: vi.fn(),
    };

    useCase = new CreateUserUseCase(mockRepository as IUserRepository);
  });

  describe("新規ユーザー作成", () => {
    it("新規ユーザーを作成してuserIdを返す", async () => {
      const generatedId = "550e8400-e29b-41d4-a716-446655440000";
      mockRepository.findUserIdBySub.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(generatedId);

      const result = await useCase.execute(validInput);

      expect(result.userId).toBe(generatedId);
    });

    it("findUserIdBySubが呼ばれる", async () => {
      mockRepository.findUserIdBySub.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue("generated-id");

      await useCase.execute(validInput);

      expect(mockRepository.findUserIdBySub).toHaveBeenCalledWith(
        validInput.sub
      );
    });

    it("createUserが正しいパラメータで呼ばれる", async () => {
      const createUserSpy = vi.spyOn(EntitiesModule, "createUser");
      mockRepository.findUserIdBySub.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue("generated-id");

      await useCase.execute(validInput);

      expect(createUserSpy).toHaveBeenCalledWith({
        accountId: validInput.accountId,
        sub: validInput.sub,
        email: validInput.email,
        name: validInput.name,
      });
    });

    it("saveがEntityを受け取って呼ばれる", async () => {
      mockRepository.findUserIdBySub.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue("generated-id");

      await useCase.execute(validInput);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: validInput.accountId,
          sub: validInput.sub,
          email: validInput.email,
          name: validInput.name,
        })
      );
    });
  });

  describe("既存ユーザー（冪等性）", () => {
    it("既存ユーザーの場合は既存のuserIdを返す", async () => {
      const existingUserId = "existing-user-id";
      mockRepository.findUserIdBySub.mockResolvedValue(existingUserId);

      const result = await useCase.execute(validInput);

      expect(result.userId).toBe(existingUserId);
    });

    it("既存ユーザーの場合はsaveが呼ばれない", async () => {
      mockRepository.findUserIdBySub.mockResolvedValue("existing-user-id");

      await useCase.execute(validInput);

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("既存ユーザーの場合はcreateUserが呼ばれない", async () => {
      const createUserSpy = vi.spyOn(EntitiesModule, "createUser");
      mockRepository.findUserIdBySub.mockResolvedValue("existing-user-id");

      await useCase.execute(validInput);

      expect(createUserSpy).not.toHaveBeenCalled();
    });
  });
});
