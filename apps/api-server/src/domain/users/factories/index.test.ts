import { describe, it, expect } from "vitest";
import { createUser, reconstructUser } from "./index";

describe("User Factory", () => {
  describe("createUser", () => {
    it("有効なパラメータでUserを作成する", () => {
      const result = createUser({
        subId: "auth0|123456789",
        email: "test@example.com",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.toPersistence().subId).toBe("auth0|123456789");
        expect(result.value.getEmail()).toBe("test@example.com");
        expect(result.value.getId()).toEqual(expect.any(String));
      }
    });

    it("無効なemailは InvalidEmailFormatError を err で返す", () => {
      const result = createUser({
        subId: "auth0|123456789",
        email: "invalid-email",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("InvalidEmailFormatError");
      }
    });

    it("無効なsubは InvalidSubFormatError を err で返す", () => {
      const result = createUser({
        subId: "",
        email: "test@example.com",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("InvalidSubFormatError");
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

    it("保存値が不正なら throw する（DB 復元の破綻は例外で落とす）", () => {
      expect(() =>
        reconstructUser({
          id: "user-1",
          subId: "auth0|123",
          email: "invalid-email",
        }),
      ).toThrow();
    });
  });
});
