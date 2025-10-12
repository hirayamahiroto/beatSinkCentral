import { describe, it, expect, vi, beforeEach } from "vitest";
import { audienceRegister, type RegisterRequest } from "./index";
import { UserFactory } from "../../../factories/User";
import { RoleFactory } from "../../../factories/Role";
import { User } from "../../../entities/user";
import { Role } from "../../../entities/Role";

vi.mock("../../../factories/User");
vi.mock("../../../factories/Role");

describe("register service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("ユーザー登録リクエストを受け取り、新しいUserを返す", async () => {
      const mockRole = new Role("audience");
      const mockUser = new User(
        "test-id",
        "test@example.com",
        "password123",
        mockRole
      );

      vi.mocked(RoleFactory.createAudience).mockReturnValue(mockRole);
      vi.mocked(UserFactory.register).mockReturnValue(mockUser);

      const request: RegisterRequest = {
        email: "test@example.com",
        password: "password123",
      };

      const result = await audienceRegister(request);

      expect(RoleFactory.createAudience).toHaveBeenCalledOnce();
      expect(UserFactory.register).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        role: mockRole,
      });
      expect(result).toEqual({
        user: mockUser,
      });
    });
  });
});
