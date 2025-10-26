import { vi, describe, it, expect, beforeEach } from "vitest";
import { UserFactory } from ".";
import { User } from "../../entities/user";

vi.mock("uuid", () => ({
  v4: vi.fn(() => "test-uuid-123"),
}));

describe("UserFactory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("新しいUserインスタンスを作成できる", () => {
      const dto = {
        auth0UserId: "auth0|123456",
        email: "test@example.com",
        username: "testuser",
        attributes: { role: "audience" },
      };

      const user = UserFactory.create(dto);

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe("test-uuid-123");
      expect(user.auth0UserId).toBe("auth0|123456");
      expect(user.email).toBe("test@example.com");
      expect(user.username).toBe("testuser");
      expect(user.attributes).toEqual({ role: "audience" });
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it("attributesが省略された場合は空オブジェクトになる", () => {
      const dto = {
        auth0UserId: "auth0|123456",
        email: "test@example.com",
        username: "testuser",
      };

      const user = UserFactory.create(dto);

      expect(user.attributes).toEqual({});
    });
  });

  describe("reconstitute", () => {
    it("既存データからUserインスタンスを再構成できる", () => {
      const data = {
        id: "existing-uuid",
        auth0UserId: "auth0|existing",
        email: "existing@example.com",
        username: "existinguser",
        attributes: { plan: "premium" },
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
      };

      const user = UserFactory.reconstitute(data);

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe("existing-uuid");
      expect(user.auth0UserId).toBe("auth0|existing");
      expect(user.email).toBe("existing@example.com");
      expect(user.username).toBe("existinguser");
      expect(user.attributes).toEqual({ plan: "premium" });
      expect(user.createdAt).toEqual(new Date("2024-01-01"));
      expect(user.updatedAt).toEqual(new Date("2024-01-02"));
    });
  });
});
