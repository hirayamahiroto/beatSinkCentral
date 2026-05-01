import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { z } from "zod";
import { handleAppError } from "./index";
import { createUserAlreadyRegisteredError } from "../domain/users/policies/assertNotRegistered";
import { createAccountIdAlreadyTakenError } from "../domain/artists/policies/assertAccountIdAvailable";
import { createInvalidEmailFormatError } from "../domain/users/valueObjects/email";
import { createInvalidSubFormatError } from "../domain/users/valueObjects/sub";
import { createInvalidNameFormatError } from "../domain/users/valueObjects/name";
import { createInvalidAccountIdFormatError } from "../domain/artists/valueObjects/accountId";
import { createInvalidArtistIdFormatError } from "../domain/artists/valueObjects/artistId";
import { createInvalidRequestFormatError } from "../app/api/[[...route]]/errors/invalidRequestFormat";

const buildIssues = () => {
  const schema = z.object({ email: z.string().min(1) });
  const result = schema.safeParse({ email: "" });
  if (result.success) {
    throw new Error("test setup: schema should have failed");
  }
  return result.error.issues;
};

const buildApp = (error: unknown) =>
  new Hono()
    .get("/", () => {
      throw error;
    })
    .onError(handleAppError);

const requestWithError = async (error: unknown) => buildApp(error).request("/");

describe("handleAppError", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("既知のAppError", () => {
    it("UserAlreadyRegisteredErrorを409と対応メッセージに変換する", async () => {
      const res = await requestWithError(createUserAlreadyRegisteredError());

      expect(res.status).toBe(409);
      expect(await res.json()).toStrictEqual({
        error: "User already registered",
      });
    });

    it("AccountIdAlreadyTakenErrorを409とaccountId埋め込みメッセージに変換する", async () => {
      const res = await requestWithError(
        createAccountIdAlreadyTakenError("taken_id"),
      );

      expect(res.status).toBe(409);
      expect(await res.json()).toStrictEqual({
        error: "Account ID already taken: taken_id",
      });
    });

    it("既知エラーは console.warn で観測ログを残す", async () => {
      const warnSpy = vi.spyOn(console, "warn");

      await requestWithError(createUserAlreadyRegisteredError());

      expect(warnSpy).toHaveBeenCalledWith("[AppError]", {
        type: "UserAlreadyRegisteredError",
        status: 409,
        message: "UserAlreadyRegisteredError",
      });
    });
  });

  describe("エントリポイント層由来のリクエスト形式エラー（400）", () => {
    it("InvalidRequestFormatErrorを400と details に issues を載せて返す", async () => {
      const issues = buildIssues();

      const res = await requestWithError(
        createInvalidRequestFormatError(issues),
      );

      expect(res.status).toBe(400);
      expect(await res.json()).toStrictEqual({
        error: "Invalid request",
        details: JSON.parse(JSON.stringify(issues)),
      });
    });
  });

  describe("Value Object由来のフォーマットエラー（422）", () => {
    it("InvalidEmailFormatErrorを422に変換する", async () => {
      const res = await requestWithError(createInvalidEmailFormatError());

      expect(res.status).toBe(422);
      expect(await res.json()).toStrictEqual({ error: "Invalid email format" });
    });

    it("InvalidSubFormatErrorを422に変換する", async () => {
      const res = await requestWithError(createInvalidSubFormatError());

      expect(res.status).toBe(422);
      expect(await res.json()).toStrictEqual({ error: "Invalid sub format" });
    });

    it("InvalidNameFormatErrorを422に変換する", async () => {
      const res = await requestWithError(createInvalidNameFormatError());

      expect(res.status).toBe(422);
      expect(await res.json()).toStrictEqual({ error: "Invalid name format" });
    });

    it("InvalidAccountIdFormatErrorを422に変換する", async () => {
      const res = await requestWithError(createInvalidAccountIdFormatError());

      expect(res.status).toBe(422);
      expect(await res.json()).toStrictEqual({
        error: "Invalid accountId format",
      });
    });

    it("InvalidArtistIdFormatErrorを422に変換する", async () => {
      const res = await requestWithError(createInvalidArtistIdFormatError());

      expect(res.status).toBe(422);
      expect(await res.json()).toStrictEqual({
        error: "Invalid artistId format",
      });
    });
  });

  describe("未知のエラー", () => {
    it("素の Error は 500 と Internal Server Error メッセージを返す", async () => {
      const res = await requestWithError(new Error("database down"));

      expect(res.status).toBe(500);
      expect(await res.json()).toStrictEqual({
        error: "Internal Server Error",
      });
    });

    it("typeフィールドを持つが errorMap 未登録のエラーは 500 に落とす", async () => {
      const unknownError = Object.assign(new Error("unknown"), {
        type: "NotRegisteredErrorType" as const,
      });

      const res = await requestWithError(unknownError);

      expect(res.status).toBe(500);
      expect(await res.json()).toStrictEqual({
        error: "Internal Server Error",
      });
    });

    it("未知エラーは console.error で記録する", async () => {
      const errorSpy = vi.spyOn(console, "error");
      const rawError = new Error("boom");

      await requestWithError(rawError);

      expect(errorSpy).toHaveBeenCalledWith("[Unhandled error]", rawError);
    });
  });
});
