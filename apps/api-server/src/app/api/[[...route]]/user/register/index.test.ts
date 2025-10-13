import { describe, it, expect } from "vitest";
import app from "./index";

describe("User Register API", () => {
  describe("POST /register - Validation", () => {
    it("emailが数値の場合は拒否される", async () => {
      const invalidPayload = {
        email: 123,
        username: "testuser",
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid request");
    });

    it("emailが無効な形式の場合は拒否される", async () => {
      const invalidPayload = {
        email: "invalid-email",
        username: "testuser",
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid request");
    });

    it("emailが空文字列の場合は拒否される", async () => {
      const invalidPayload = {
        email: "",
        username: "testuser",
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid request");
    });

    it("usernameが空文字列の場合は拒否される", async () => {
      const invalidPayload = {
        email: "test@example.com",
        username: "",
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid request");
    });

    it("usernameが数値の場合は拒否される", async () => {
      const invalidPayload = {
        email: "test@example.com",
        username: 12345678,
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid request");
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
      expect(json.error).toBe("Invalid request");
    });

    it("有効なリクエストは受け入れられる", async () => {
      const validPayload = {
        email: "test@example.com",
        username: "testuser",
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validPayload),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.user.email).toBe("test@example.com");
      expect(json.user.username).toBe("testuser");
      expect(json.isArtist).toBe(false);
    });
  });
});
