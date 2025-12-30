import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUserRepository } from "./index";
import { IUserRepository } from "../../../domain/users/repositories";

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

describe("createUserRepository", () => {
  let repository: IUserRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = createUserRepository(mockDb as never);
  });

  describe("create", () => {
    it("ユーザーを作成してEntityを返す", async () => {
      const mockRecord = {
        auth0UserId: "auth0|123456789",
        email: "test@example.com",
        username: "testuser",
        attributes: { role: "user" },
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      mockDb.returning.mockResolvedValue([mockRecord]);

      const result = await repository.create({
        auth0UserId: "auth0|123456789",
        email: "test@example.com",
        username: "testuser",
        attributes: { role: "user" },
      });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith({
        auth0UserId: "auth0|123456789",
        email: "test@example.com",
        username: "testuser",
        attributes: { role: "user" },
      });
      expect(result.auth0UserId).toBe("auth0|123456789");
      expect(result.email).toBe("test@example.com");
      expect(result.username).toBe("testuser");
    });

    it("attributesが未指定の場合は空オブジェクトで保存", async () => {
      const mockRecord = {
        auth0UserId: "auth0|123456789",
        email: "test@example.com",
        username: "testuser",
        attributes: {},
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      mockDb.returning.mockResolvedValue([mockRecord]);

      await repository.create({
        auth0UserId: "auth0|123456789",
        email: "test@example.com",
        username: "testuser",
      });

      expect(mockDb.values).toHaveBeenCalledWith({
        auth0UserId: "auth0|123456789",
        email: "test@example.com",
        username: "testuser",
        attributes: {},
      });
    });
  });

  describe("findByAuth0UserId", () => {
    it("ユーザーが存在する場合はEntityを返す", async () => {
      const mockRecord = {
        auth0UserId: "auth0|123456789",
        email: "test@example.com",
        username: "testuser",
        attributes: {},
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      mockDb.limit.mockResolvedValue([mockRecord]);

      const result = await repository.findByAuth0UserId("auth0|123456789");

      expect(result).not.toBeNull();
      expect(result?.auth0UserId).toBe("auth0|123456789");
      expect(result?.email).toBe("test@example.com");
    });

    it("ユーザーが存在しない場合はnullを返す", async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await repository.findByAuth0UserId("auth0|nonexistent");

      expect(result).toBeNull();
    });
  });
});
