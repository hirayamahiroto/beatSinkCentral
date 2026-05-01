import { describe, it, expect, vi } from "vitest";
import { Hono } from "hono";
import usersCreate, { type CreateUserRequestBody } from "./index";
import { handleAppError } from "../../../../../errorMap";

vi.mock("../../../../../infrastructure/database", () => ({
  db: {
    insert: vi.fn(),
  },
}));

const app = new Hono().route("/", usersCreate).onError(handleAppError);

describe("User Create API", () => {
  describe("POST / - バリデーション", () => {
    it("正しい形式でも認証なしなら201を返さない", async () => {
      const payload = {
        email: "test@example.com",
        accountId: "test_account",
      } satisfies CreateUserRequestBody;

      const res = await app.request("/", {
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

      const res = await app.request("/", {
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

      const res = await app.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
    });

    it("必須フィールドが欠けている場合は400を返す", async () => {
      const res = await app.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });

    it("型が不正な値の場合は400を返す", async () => {
      const res = await app.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: 123, accountId: 456 }),
      });

      expect(res.status).toBe(400);
    });

    it("emailの形式が不正な場合は400と Invalid email format メッセージを返す", async () => {
      const invalidPayload: CreateUserRequestBody = {
        email: "not-an-email",
        accountId: "test_account",
      };

      const res = await app.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const body = (await res.json()) as {
        error: string;
        details: Array<{ path: Array<string>; message: string }>;
      };
      expect(body.error).toBe("Invalid request");
      expect(
        body.details.some(
          (issue) =>
            issue.path[0] === "email" &&
            issue.message === "Invalid email format"
        )
      ).toBe(true);
    });

    it("accountIdが256文字以上の場合は400と長さ超過メッセージを返す", async () => {
      const invalidPayload: CreateUserRequestBody = {
        email: "test@example.com",
        accountId: "a".repeat(256),
      };

      const res = await app.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const body = (await res.json()) as {
        details: Array<{ path: Array<string>; message: string }>;
      };
      expect(
        body.details.some(
          (issue) =>
            issue.path[0] === "accountId" &&
            issue.message === "accountId must be 255 characters or less"
        )
      ).toBe(true);
    });

    it("emailが空文字列の場合は email is required メッセージを返す", async () => {
      const invalidPayload: CreateUserRequestBody = {
        email: "",
        accountId: "test_account",
      };

      const res = await app.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      const body = (await res.json()) as {
        details: Array<{ path: Array<string>; message: string }>;
      };
      expect(res.status).toBe(400);
      expect(
        body.details.some(
          (issue) =>
            issue.path[0] === "email" && issue.message === "email is required"
        )
      ).toBe(true);
    });
  });
});
