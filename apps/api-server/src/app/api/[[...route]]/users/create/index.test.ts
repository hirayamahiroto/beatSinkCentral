import { describe, it, expect, vi } from "vitest";
import usersCreate, { type CreateUserRequestBody } from "./index";

vi.mock("../../../../../infrastructure/database", () => ({
  db: {
    insert: vi.fn(),
  },
}));

describe("User Create API", () => {
  describe("POST / - バリデーション", () => {
    it("正しい形式でも認証なしなら201を返さない", async () => {
      const payload = {
        email: "test@example.com",
        accountId: "test_account",
      } satisfies CreateUserRequestBody;

      const res = await usersCreate.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect(res.status).not.toBe(201);
    });

    it("emailが空文字列の場合は400を返す", async () => {
      const invalidPayload: CreateUserRequestBody = {
        email: "",
        accountId: "test_account",
      };

      const res = await usersCreate.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
    });

    it("accountIdが空文字列の場合は400を返す", async () => {
      const invalidPayload: CreateUserRequestBody = {
        email: "test@example.com",
        accountId: "",
      };

      const res = await usersCreate.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
    });

    it("必須フィールドが欠けている場合は400を返す", async () => {
      const res = await usersCreate.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });

    it("型が不正な値の場合は400を返す", async () => {
      const res = await usersCreate.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: 123, accountId: 456 }),
      });

      expect(res.status).toBe(400);
    });
  });
});
