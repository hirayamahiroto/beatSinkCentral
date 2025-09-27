import { describe, it, expect, vi, beforeEach } from "vitest";
import { register, type RegisterRequest } from "./index";
import { UserFactory } from "../../../factory/UserFactory";
import { RoleFactory } from "../../../factory/RoleFactory";
import { User } from "../../../entities/user";
import { Role } from "../../../entities/Role";

vi.mock("../../../factory/UserFactory");
vi.mock("../../../factory/RoleFactory");

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

      const result = await register(request);

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
