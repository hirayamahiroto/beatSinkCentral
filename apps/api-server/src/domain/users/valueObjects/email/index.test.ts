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
        const emailObj = createEmail(email);
        expect(emailObj.value).toBe(email);
      });
    });

    it("無効なメールアドレスではエラーをスローする", () => {
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
        expect(() => createEmail(email)).toThrow("Invalid email format");
      });
    });

    it("254文字を超えるメールアドレスは拒否される", () => {
      const longEmail = "a".repeat(243) + "@example.com";
      expect(() => createEmail(longEmail)).toThrow("Invalid email format");
    });

    it("254文字のメールアドレスは許可される", () => {
      const maxLengthEmail = "a".repeat(242) + "@example.com";
      const emailObj = createEmail(maxLengthEmail);
      expect(emailObj.value).toBe(maxLengthEmail);
    });

    it("日本語ドメインを含むメールアドレスを処理できる", () => {
      const email = "test@日本.jp";
      const emailObj = createEmail(email);
      expect(emailObj.value).toBe(email);
    });
  });
});
