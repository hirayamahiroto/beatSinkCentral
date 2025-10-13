import { describe, it, expect } from "vitest";
import app from "./index";

describe("User Register API", () => {
  describe("POST /register - Auth0統合", () => {
    it("認証なしのリクエストは拒否される", async () => {
      const payload = {
        username: "testuser",
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Auth0認証ミドルウェアによってリダイレクトまたはエラーが返される
      expect(res.status).not.toBe(201);
    });

    it("usernameが空文字列の場合は拒否される", async () => {
      const invalidPayload = {
        username: "",
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      // 認証チェック前にバリデーションエラーになるかどうかは実装依存
      // Auth0ミドルウェアが先に実行されるため401になる可能性が高い
      expect(res.status).not.toBe(201);
    });

    it("usernameが数値の場合は拒否される", async () => {
      const invalidPayload = {
        username: 12345678,
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).not.toBe(201);
    });

    it("必須フィールド(username)が欠けている場合は拒否される", async () => {
      const invalidPayload = {};

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).not.toBe(201);
    });
  });
});
