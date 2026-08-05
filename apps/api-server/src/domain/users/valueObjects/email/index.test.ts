import { describe, it, expect } from "vitest";
import { createEmail } from "./index";

describe("Email", () => {
  describe("createEmail", () => {
    it("有効なメールアドレスでEmailオブジェクトを作成できる", () => {
      const validEmails = [
        "test@example.com",
        "user.name@example.co.jp",
        "test+tag@example.org",
        "123@test.com",
        "a@b.co",
      ];

      validEmails.forEach((email) => {
        const result = createEmail(email);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.value).toBe(email);
        }
      });
    });

    it("無効なメールアドレスは err を返す", () => {
      const invalidEmails = [
        "notanemail",
        "@example.com",
        "test@",
        "test@@example.com",
        "test @example.com",
        "test@example",
        "",
        "test.example.com",
      ];

      invalidEmails.forEach((email) => {
        expect(createEmail(email).ok).toBe(false);
      });
    });

    it("254文字を超えるメールアドレスは err を返す", () => {
      const longEmail = "a".repeat(243) + "@example.com";

      expect(createEmail(longEmail).ok).toBe(false);
    });

    it("254文字のメールアドレスは許可される", () => {
      const maxLengthEmail = "a".repeat(242) + "@example.com";
      const result = createEmail(maxLengthEmail);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.value).toBe(maxLengthEmail);
      }
    });

    it("日本語ドメインを含むメールアドレスを処理できる", () => {
      const result = createEmail("test@日本.jp");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.value).toBe("test@日本.jp");
      }
    });

    it("返るエラーは InvalidEmailFormatError 型", () => {
      const result = createEmail("notanemail");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("InvalidEmailFormatError");
      }
    });
  });
});
