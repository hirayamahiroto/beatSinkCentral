import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createUser } from "./index";
import * as Auth0UserIdModule from "../valueObjects/auth0UserId";
import * as EmailModule from "../valueObjects/email";
import * as UsernameModule from "../valueObjects/username";

describe("User Entity", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("createUser", () => {
    it("有効なパラメータでUserを作成できる", () => {
      const user = createUser({
        auth0UserId: "auth0|123456789",
        email: "test@example.com",
        username: "testuser",
        attributes: { role: "admin" },
      });

      expect(user.auth0UserId).toBe("auth0|123456789");
      expect(user.email).toBe("test@example.com");
      expect(user.username).toBe("testuser");
      expect(user.attributes).toStrictEqual({ role: "admin" });
      expect(user.createdAt).toStrictEqual(
        new Date("2024-01-01T00:00:00.000Z")
      );
      expect(user.updatedAt).toStrictEqual(
        new Date("2024-01-01T00:00:00.000Z")
      );
    });

    it("attributesを省略した場合は空オブジェクトになる", () => {
      const user = createUser({
        auth0UserId: "auth0|123456789",
        email: "test@example.com",
        username: "testuser",
      });

      expect(user.attributes).toStrictEqual({});
    });

    it("各値オブジェクトの生成関数が呼び出される", () => {
      const createAuth0UserIdSpy = vi.spyOn(
        Auth0UserIdModule,
        "createAuth0UserId"
      );
      const createEmailSpy = vi.spyOn(EmailModule, "createEmail");
      const createUsernameSpy = vi.spyOn(UsernameModule, "createUsername");

      createUser({
        auth0UserId: "auth0|123456789",
        email: "test@example.com",
        username: "testuser",
      });

      expect(createAuth0UserIdSpy).toHaveBeenCalledWith("auth0|123456789");
      expect(createEmailSpy).toHaveBeenCalledWith("test@example.com");
      expect(createUsernameSpy).toHaveBeenCalledWith("testuser");
    });
  });
});
