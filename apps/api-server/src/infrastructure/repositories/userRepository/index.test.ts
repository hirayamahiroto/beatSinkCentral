import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUserRepository } from "./index";
import type { IUserRepository } from "../../../domain/users/repositories";

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

  describe("save", () => {
    it("永続化したUserを返す", async () => {
      const saveData = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        subId: "auth0|123456789",
        email: "test@example.com",
      };
      mockDb.returning.mockResolvedValue([saveData]);

      const result = await repository.save(saveData);

      expect(mockDb.values).toHaveBeenCalledWith(saveData);
      expect(result.toPersistence()).toStrictEqual(saveData);
    });
  });

  describe("findBySub", () => {
    it("ユーザーが存在する場合はUserを返す", async () => {
      const row = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        subId: "auth0|123456789",
        email: "test@example.com",
      };
      mockDb.limit.mockResolvedValue([row]);

      const result = await repository.findBySub("auth0|123456789");

      expect(result).not.toBeNull();
      expect(result?.toPersistence()).toStrictEqual(row);
    });

    it("ユーザーが存在しない場合はnullを返す", async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await repository.findBySub("auth0|nonexistent");

      expect(result).toBeNull();
    });
  });
});
