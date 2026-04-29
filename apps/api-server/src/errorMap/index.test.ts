import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveErrorResponse } from "./index";
import { createUserAlreadyRegisteredError } from "../domain/users/policies/assertNotRegistered";
import { createAccountIdAlreadyTakenError } from "../domain/artists/policies/assertAccountIdAvailable";
import { createInvalidEmailFormatError } from "../domain/users/valueObjects/email";
import { createInvalidSubFormatError } from "../domain/users/valueObjects/sub";
import { createInvalidNameFormatError } from "../domain/users/valueObjects/name";
import { createInvalidAccountIdFormatError } from "../domain/artists/valueObjects/accountId";
import { createInvalidArtistIdFormatError } from "../domain/artists/valueObjects/artistId";

describe("resolveErrorResponse", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("既知のAppError", () => {
    it("UserAlreadyRegisteredErrorを409と対応メッセージに変換する", () => {
      const error = createUserAlreadyRegisteredError();

      const response = resolveErrorResponse(error);

      expect(response).toStrictEqual({
        body: { error: "User already registered" },
        status: 409,
      });
    });

    it("AccountIdAlreadyTakenErrorを409とaccountId埋め込みメッセージに変換する", () => {
      const error = createAccountIdAlreadyTakenError("taken_id");

      const response = resolveErrorResponse(error);

      expect(response).toStrictEqual({
        body: { error: "Account ID already taken: taken_id" },
        status: 409,
      });
    });

    it("既知エラーは console.warn で観測ログを残す", () => {
      const warnSpy = vi.spyOn(console, "warn");
      const error = createUserAlreadyRegisteredError();

      resolveErrorResponse(error);

      expect(warnSpy).toHaveBeenCalledWith("[AppError]", {
        type: "UserAlreadyRegisteredError",
        status: 409,
        message: "UserAlreadyRegisteredError",
      });
    });
  });

  describe("Value Object由来のフォーマットエラー（422）", () => {
    it("InvalidEmailFormatErrorを422に変換する", () => {
      const response = resolveErrorResponse(createInvalidEmailFormatError());

      expect(response).toStrictEqual({
        body: { error: "Invalid email format" },
        status: 422,
      });
    });

    it("InvalidSubFormatErrorを422に変換する", () => {
      const response = resolveErrorResponse(createInvalidSubFormatError());

      expect(response).toStrictEqual({
        body: { error: "Invalid sub format" },
        status: 422,
      });
    });

    it("InvalidNameFormatErrorを422に変換する", () => {
      const response = resolveErrorResponse(createInvalidNameFormatError());

      expect(response).toStrictEqual({
        body: { error: "Invalid name format" },
        status: 422,
      });
    });

    it("InvalidAccountIdFormatErrorを422に変換する", () => {
      const response = resolveErrorResponse(
        createInvalidAccountIdFormatError()
      );

      expect(response).toStrictEqual({
        body: { error: "Invalid accountId format" },
        status: 422,
      });
    });

    it("InvalidArtistIdFormatErrorを422に変換する", () => {
      const response = resolveErrorResponse(createInvalidArtistIdFormatError());

      expect(response).toStrictEqual({
        body: { error: "Invalid artistId format" },
        status: 422,
      });
    });
  });

  describe("未知のエラー", () => {
    it("素の Error は 500 と Internal Server Error メッセージを返す", () => {
      const response = resolveErrorResponse(new Error("database down"));

      expect(response).toStrictEqual({
        body: { error: "Internal Server Error" },
        status: 500,
      });
    });

    it("Errorインスタンスでない値も 500 に落とす", () => {
      const response = resolveErrorResponse("plain string");

      expect(response).toStrictEqual({
        body: { error: "Internal Server Error" },
        status: 500,
      });
    });

    it("typeフィールドを持つが errorMap 未登録のエラーは 500 に落とす", () => {
      const unknownError = Object.assign(new Error("unknown"), {
        type: "NotRegisteredErrorType" as const,
      });

      const response = resolveErrorResponse(unknownError);

      expect(response).toStrictEqual({
        body: { error: "Internal Server Error" },
        status: 500,
      });
    });

    it("未知エラーは console.error で記録する", () => {
      const errorSpy = vi.spyOn(console, "error");
      const rawError = new Error("boom");

      resolveErrorResponse(rawError);

      expect(errorSpy).toHaveBeenCalledWith("[Unhandled error]", rawError);
    });
  });
});
