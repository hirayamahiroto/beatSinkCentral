import { describe, it, expect } from "vitest";
import app from "./index";

describe("Audience Register API", () => {
  describe("POST /register - Validation", () => {
    it("emailが数値の場合は拒否される", async () => {
      const invalidPayload = {
        email: 123,
        password: "validPassword123",
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("request is invalid");
    });

    it("emailが無効な形式の場合は拒否される", async () => {
      const invalidPayload = {
        email: "invalid-email",
        password: "validPassword123",
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("request is invalid");
    });

    it("emailが空文字列の場合は拒否される", async () => {
      const invalidPayload = {
        email: "",
        password: "validPassword123",
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("request is invalid");
    });

    it("passwordが8文字未満の場合は拒否される", async () => {
      const invalidPayload = {
        email: "test@example.com",
        password: "short",
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("request is invalid");
    });

    it("passwordが数値の場合は拒否される", async () => {
      const invalidPayload = {
        email: "test@example.com",
        password: 12345678,
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("request is invalid");
    });

    it("必須フィールドが欠けている場合は拒否される", async () => {
      const invalidPayload = {
        email: "test@example.com",
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("request is invalid");
    });
  });
});
