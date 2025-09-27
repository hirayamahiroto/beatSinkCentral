import { vi, describe, it, expect } from "vitest";
import { UserFactory } from ".";
import { User } from "../../entities/user";
import { Role } from "../../entities/Role";

vi.mock("uuid", () => ({
  v4: vi.fn(() => "test-uuid-123"),
}));

describe("UserFactory", () => {
  describe("register", () => {
    it("audienceロールで新しいUserインスタンスを作成できる", () => {
      const role = new Role("audience");
      const dto = {
        email: "test@example.com",
        password: "password123",
        role: role,
      };

      const user = UserFactory.register(dto);

      expect(user).toBeInstanceOf(User);
    });
  });
});
