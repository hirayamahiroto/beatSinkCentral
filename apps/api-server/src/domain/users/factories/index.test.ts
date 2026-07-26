import { describe, it, expect } from "vitest";
import { createUser, reconstructUser } from "./index";

describe("User Factory", () => {
  describe("createUser", () => {
    it("有効なパラメータで ok(User) を返す", () => {
      const result = createUser({
        subId: "auth0|123456789",
        email: "test@example.com",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getSub()).toBe("auth0|123456789");
        expect(result.value.getEmail()).toBe("test@example.com");
        expect(result.value.getId()).toEqual(expect.any(String));
      }
    });

    it("無効なemailで err を返す", () => {
      const result = createUser({
        subId: "auth0|123456789",
        email: "invalid-email",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("InvalidEmailFormatError");
      }
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

    it("保存データが不正なら throw する（想定外・500系）", () => {
      expect(() =>
        reconstructUser({ id: "user-1", subId: "auth0|123", email: "broken" }),
      ).toThrow();
    });
  });
});
