import { describe, it, expect } from "vitest";
import { createUser, reconstructUser } from "./index";

describe("User Factory", () => {
  describe("createUser", () => {
    it("有効なパラメータでUserを作成する", () => {
      const user = createUser({
        subId: "auth0|123456789",
        email: "test@example.com",
      });

      expect(user.getSub()).toBe("auth0|123456789");
      expect(user.getEmail()).toBe("test@example.com");
      expect(user.getId()).toEqual(expect.any(String));
    });

    it("無効なemailでエラーをスローする", () => {
      expect(() =>
        createUser({
          subId: "auth0|123456789",
          email: "invalid-email",
        }),
      ).toThrow();
    });
  });

  describe("reconstructUser", () => {
    it("既存idを保持してUserを再構築する", () => {
      const user = reconstructUser({
        id: "user-1",
        subId: "auth0|123",
        email: "test@example.com",
      });

      expect(user.toPersistence()).toStrictEqual({
        id: "user-1",
        subId: "auth0|123",
        email: "test@example.com",
      });
    });
  });
});
