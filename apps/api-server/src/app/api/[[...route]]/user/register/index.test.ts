import { describe, it, expect } from "vitest";
import app from "./index";

describe("HumanBeatboxer API", () => {
  describe("POST /register - Validation", () => {
    it("文字列フィールドの型チェック", async () => {
      const invalidPayload = {
        email: 123, // 数値
        password: "validPassword",
        artistName: "validName",
        age: 25,
        sex: "male",
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe(
        "Missing required fields: email, password, artistName"
      );
    });

    it("空文字列フィールドの検証", async () => {
      const invalidPayload = {
        email: "  ", // 空白のみ
        password: "validPassword",
        artistName: "validName",
        age: 25,
        sex: "male",
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe(
        "Missing required fields: email, password, artistName"
      );
    });

    it("age が0の場合は拒否される", async () => {
      const invalidPayload = {
        email: "test@example.com",
        password: "validPassword",
        artistName: "validName",
        age: 0, // 0は拒否
        sex: "male",
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid field: age must be 1-120 number");
    });

    it("age が文字列の場合は拒否される", async () => {
      const invalidPayload = {
        email: "test@example.com",
        password: "validPassword",
        artistName: "validName",
        age: "25", // 文字列は拒否
        sex: "male",
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid field: age must be 1-120 number");
    });

    it("age が範囲外の場合は拒否される", async () => {
      const invalidPayload = {
        email: "test@example.com",
        password: "validPassword",
        artistName: "validName",
        age: 150, // 120を超える
        sex: "male",
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid field: age must be 1-120 number");
    });

    it("sex が無効な値の場合は拒否される", async () => {
      const invalidPayload = {
        email: "test@example.com",
        password: "validPassword",
        artistName: "validName",
        age: 25,
        sex: "invalid", // 無効な値
      };

      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe(
        'Invalid field: sex must be "male" | "female" | "other"'
      );
    });
  });
});
