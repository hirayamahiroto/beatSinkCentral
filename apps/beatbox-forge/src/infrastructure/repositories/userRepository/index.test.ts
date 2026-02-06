import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUserRepository } from "./index";
import { IUserRepository } from "../../../domain/users/repositories";
import { User } from "../../../domain/users/entities";

// DBモック
const mockDb = {
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
};

// Userモックファクトリ
const createMockUser = (data: {
  accountId: string;
  sub: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}): User => ({
  toJSON: () => ({
    accountId: data.accountId,
    sub: data.sub,
    email: data.email,
    name: data.name,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  }),
});

describe("createUserRepository", () => {
  let repository: IUserRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = createUserRepository(mockDb as never);
  });

  describe("save", () => {
    it("Entityを永続化してDB生成のidを返す", async () => {
      const generatedId = "550e8400-e29b-41d4-a716-446655440000";
      mockDb.returning.mockResolvedValue([{ id: generatedId }]);

      const user = createMockUser({
        accountId: "acc_123456789",
        sub: "auth0|123456789",
        email: "test@example.com",
        name: "testuser",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      });

      const result = await repository.save(user);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith({
        accountId: "acc_123456789",
        sub: "auth0|123456789",
        email: "test@example.com",
        name: "testuser",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      });
      expect(result).toBe(generatedId);
    });
  });

  describe("findUserIdBySub", () => {
    it("ユーザーが存在する場合はidを返す", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      mockDb.limit.mockResolvedValue([{ id: userId }]);

      const result = await repository.findUserIdBySub("auth0|123456789");

      expect(result).toBe(userId);
    });

    it("ユーザーが存在しない場合はnullを返す", async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await repository.findUserIdBySub("auth0|nonexistent");

      expect(result).toBeNull();
    });
  });
});
