import { describe, it, expect, vi, afterEach } from "vitest";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { validateRequest } from "../app/api/[[...route]]/validators/validateRequest";
import { createAppErrorHandler, handleAppError } from "./index";
import type { LogFields, LogLevel, Logger } from "../utils/logger";
import { createUserAlreadyRegisteredError } from "../domain/users/errors/userAlreadyRegistered";
import { createAccountIdAlreadyTakenError } from "../domain/artists/errors/accountIdAlreadyTaken";
import { createEmailAlreadyTakenError } from "../domain/users/errors/emailAlreadyTaken";
import { createInvalidEmailFormatError } from "../domain/users/valueObjects/email";
import { createInvalidSubFormatError } from "../domain/users/valueObjects/sub";
import { createInvalidNameFormatError } from "../domain/users/valueObjects/name";
import { createInvalidAccountIdFormatError } from "../domain/artists/valueObjects/accountId";
import { createInvalidArtistIdFormatError } from "../domain/artists/valueObjects/artistId";
import { createInvalidRequestFormatError } from "../app/api/[[...route]]/errors/invalidRequestFormat";
import { createRequestBodyTooLargeError } from "../app/api/[[...route]]/errors/requestBodyTooLarge";
import { createUnauthorizedError } from "../middlewares/auth0/errors/unauthorized";
import { createProfileNotPublishableError } from "../domain/artistProfiles/policies/publishability";
import {
  createUnsupportedImageTypeError,
  createImageTooLargeError,
  createEmptyImageFileError,
} from "../domain/artistProfiles/valueObjects/profileImage";
import { createProfileImageUploadFailedError } from "../domain/artistProfiles/errors/profileImageUploadFailed";
import { requestContextMiddleware } from "../middlewares/requestContext";

type RecordedLog = {
  level: LogLevel;
  event: string;
  fields: LogFields;
};

const createRecordingLogger = () => {
  const logs: RecordedLog[] = [];
  const record = (level: LogLevel) => (event: string, fields: LogFields) =>
    void logs.push({ level, event, fields });
  const logger: Logger = {
    info: record("info"),
    warn: record("warn"),
    error: record("error"),
  };
  return { logger, logs };
};

const buildIssues = () => {
  const schema = z.object({ email: z.string().min(1) });
  const result = schema.safeParse({ email: "" });
  if (result.success) {
    throw new Error("test setup: schema should have failed");
  }
  return result.error.issues;
};

const buildIssuesCarryingInputValue = () => {
  const schema = z.object({ plan: z.literal("free") });
  const result = schema.safeParse({ plan: "secret-value" });
  if (result.success) {
    throw new Error("test setup: schema should have failed");
  }
  return result.error.issues;
};

const requestWithError = async (error: unknown) => {
  const { logger, logs } = createRecordingLogger();
  const response = await new Hono()
    .get("/", () => {
      throw error;
    })
    .onError(createAppErrorHandler(logger))
    .request("/");
  return { response, logs };
};

const clientResponseOf = async (error: unknown) => {
  const { response } = await requestWithError(error);
  return { status: response.status, body: await response.json() };
};

const logOf = async (error: unknown) => {
  const { logs } = await requestWithError(error);
  expect(logs).toHaveLength(1);
  return logs[0];
};

const REQUEST_FIELDS = { method: "GET", route: "/" };

describe("createAppErrorHandler", () => {
  describe("クライアント向けレスポンス", () => {
    it("UserAlreadyRegisteredErrorを409と対応メッセージに変換する", async () => {
      expect(
        await clientResponseOf(createUserAlreadyRegisteredError()),
      ).toStrictEqual({
        status: 409,
        body: { error: "User already registered" },
      });
    });

    it("AccountIdAlreadyTakenErrorを409とaccountId埋め込みメッセージに変換する", async () => {
      expect(
        await clientResponseOf(createAccountIdAlreadyTakenError("taken_id")),
      ).toStrictEqual({
        status: 409,
        body: { error: "Account ID already taken: taken_id" },
      });
    });

    it("EmailAlreadyTakenErrorを409に変換し、emailを露出しない", async () => {
      expect(
        await clientResponseOf(createEmailAlreadyTakenError()),
      ).toStrictEqual({
        status: 409,
        body: { error: "Email already taken" },
      });
    });

    it("UnauthorizedErrorを401に変換する", async () => {
      expect(await clientResponseOf(createUnauthorizedError())).toStrictEqual({
        status: 401,
        body: { error: "Unauthorized" },
      });
    });

    it("InvalidRequestFormatErrorを400と details に issues を載せて返す", async () => {
      const issues = buildIssues();

      expect(
        await clientResponseOf(createInvalidRequestFormatError(issues)),
      ).toStrictEqual({
        status: 400,
        body: {
          error: "Invalid request",
          details: JSON.parse(JSON.stringify(issues)),
        },
      });
    });

    it("ProfileNotPublishableErrorを422と details に missingFields を載せて返す", async () => {
      expect(
        await clientResponseOf(createProfileNotPublishableError(["name"])),
      ).toStrictEqual({
        status: 422,
        body: {
          error: "Profile is not publishable: required fields are missing",
          details: { missingFields: ["name"] },
        },
      });
    });

    it.each([
      [
        "InvalidEmailFormatError",
        createInvalidEmailFormatError,
        "Invalid email format",
      ],
      [
        "InvalidSubFormatError",
        createInvalidSubFormatError,
        "Invalid sub format",
      ],
      [
        "InvalidNameFormatError",
        createInvalidNameFormatError,
        "Invalid name format",
      ],
      [
        "InvalidAccountIdFormatError",
        createInvalidAccountIdFormatError,
        "Invalid accountId format",
      ],
      [
        "InvalidArtistIdFormatError",
        createInvalidArtistIdFormatError,
        "Invalid artistId format",
      ],
    ])(
      "Value Object由来の %s を422に変換する",
      async (_name, createError, message) => {
        expect(await clientResponseOf(createError())).toStrictEqual({
          status: 422,
          body: { error: message },
        });
      },
    );

    it("UnsupportedImageTypeErrorを422に変換する", async () => {
      expect(
        await clientResponseOf(createUnsupportedImageTypeError()),
      ).toStrictEqual({
        status: 422,
        body: { error: "Unsupported image type" },
      });
    });

    it("RequestBodyTooLargeErrorを413に変換する", async () => {
      expect(
        await clientResponseOf(createRequestBodyTooLargeError()),
      ).toStrictEqual({
        status: 413,
        body: { error: "Request body is too large" },
      });
    });

    it("ImageTooLargeErrorを413に変換する", async () => {
      expect(await clientResponseOf(createImageTooLargeError())).toStrictEqual({
        status: 413,
        body: { error: "Image file is too large" },
      });
    });

    it("EmptyImageFileErrorを422に変換する", async () => {
      expect(await clientResponseOf(createEmptyImageFileError())).toStrictEqual(
        {
          status: 422,
          body: { error: "Image file is empty" },
        },
      );
    });

    it("ProfileImageUploadFailedErrorを502に変換する", async () => {
      expect(
        await clientResponseOf(
          createProfileImageUploadFailedError("Bucket not found"),
        ),
      ).toStrictEqual({
        status: 502,
        body: { error: "Failed to upload image" },
      });
    });

    it("未知のエラーは内部事情を伏せて500を返す", async () => {
      expect(
        await clientResponseOf(new Error("connect ECONNREFUSED 10.0.0.1:5432")),
      ).toStrictEqual({
        status: 500,
        body: { error: "Internal Server Error" },
      });
    });

    it("typeフィールドを持つが errorMap 未登録のエラーは 500 に落とす", async () => {
      const unknownError = Object.assign(new Error("unknown"), {
        type: "NotRegisteredErrorType" as const,
      });

      expect(await clientResponseOf(unknownError)).toStrictEqual({
        status: 500,
        body: { error: "Internal Server Error" },
      });
    });

    it("HTTPException(400) を形式エラーとして 400 に変換する", async () => {
      expect(
        await clientResponseOf(
          new HTTPException(400, { message: "Malformed JSON in request body" }),
        ),
      ).toStrictEqual({
        status: 400,
        body: { error: "Malformed request body" },
      });
    });

    it("400 以外の HTTPException は 500 のまま扱う", async () => {
      expect(await clientResponseOf(new HTTPException(503))).toStrictEqual({
        status: 500,
        body: { error: "Internal Server Error" },
      });
    });
  });

  describe("内部向けログ", () => {
    it("業務上の正常拒否は info で記録する", async () => {
      expect(await logOf(createUserAlreadyRegisteredError())).toStrictEqual({
        level: "info",
        event: "AppError",
        fields: {
          ...REQUEST_FIELDS,
          errorType: "UserAlreadyRegisteredError",
          status: 409,
        },
      });
    });

    it("認証失敗は warn で記録する", async () => {
      expect(await logOf(createUnauthorizedError())).toStrictEqual({
        level: "warn",
        event: "AppError",
        fields: {
          ...REQUEST_FIELDS,
          errorType: "UnauthorizedError",
          status: 401,
        },
      });
    });

    it("認証基盤由来の値の契約違反は warn で記録する", async () => {
      expect(await logOf(createInvalidSubFormatError())).toStrictEqual({
        level: "warn",
        event: "AppError",
        fields: {
          ...REQUEST_FIELDS,
          errorType: "InvalidSubFormatError",
          status: 422,
        },
      });
    });

    it("ストレージ書き込み失敗は error で記録する", async () => {
      expect(
        await logOf(createProfileImageUploadFailedError("Bucket not found")),
      ).toStrictEqual({
        level: "error",
        event: "AppError",
        fields: {
          ...REQUEST_FIELDS,
          errorType: "ProfileImageUploadFailedError",
          status: 502,
          context: { reason: "Bucket not found" },
        },
      });
    });

    it("未知のエラーは error で name / message / stack を記録する", async () => {
      const rawError = new Error("connect ECONNREFUSED 10.0.0.1:5432");

      expect(await logOf(rawError)).toStrictEqual({
        level: "error",
        event: "UnhandledError",
        fields: {
          ...REQUEST_FIELDS,
          errorName: "Error",
          message: "connect ECONNREFUSED 10.0.0.1:5432",
          stack: rawError.stack,
        },
      });
    });

    it("logFields を宣言したエラーは context に構造化して載せる", async () => {
      expect(
        (await logOf(createAccountIdAlreadyTakenError("taken_id"))).fields,
      ).toStrictEqual({
        ...REQUEST_FIELDS,
        errorType: "AccountIdAlreadyTakenError",
        status: 409,
        context: { accountId: "taken_id" },
      });
    });

    it("公開可否の欠落項目は context に載せる", async () => {
      expect(
        (await logOf(createProfileNotPublishableError(["name", "story"])))
          .fields,
      ).toStrictEqual({
        ...REQUEST_FIELDS,
        errorType: "ProfileNotPublishableError",
        status: 422,
        context: { missingFields: ["name", "story"] },
      });
    });

    it("logFields を宣言していないエラーは context を持たない", async () => {
      expect(
        (await logOf(createInvalidEmailFormatError())).fields,
      ).not.toHaveProperty("context");
    });
  });

  describe("クライアント向けと内部向けの分離", () => {
    it("リクエスト形式エラーのログには入力値を残さず path のみ載せる", async () => {
      const error = createInvalidRequestFormatError(
        buildIssuesCarryingInputValue(),
      );

      const { response, logs } = await requestWithError(error);

      expect(JSON.stringify(await response.json())).toContain("secret-value");
      expect(logs[0].fields).toStrictEqual({
        ...REQUEST_FIELDS,
        errorType: "InvalidRequestFormatError",
        status: 400,
        context: { issuePaths: ["plan"] },
      });
    });

    it("ログにはクライアント向け文言を含めない", async () => {
      const log = await logOf(createUserAlreadyRegisteredError());

      expect(JSON.stringify(log.fields)).not.toContain(
        "User already registered",
      );
    });

    it("クライアントには内部ログ用のフィールドを返さない", async () => {
      const { body } = await clientResponseOf(
        createAccountIdAlreadyTakenError("taken_id"),
      );

      expect(body).not.toHaveProperty("errorType");
      expect(body).not.toHaveProperty("context");
      expect(body).not.toHaveProperty("stack");
      expect(body).not.toHaveProperty("requestId");
      expect(body).not.toHaveProperty("route");
    });
  });

  describe("リクエスト相関", () => {
    const requestWithContext = async (
      error: unknown,
      headers: Record<string, string>,
    ) => {
      const { logger, logs } = createRecordingLogger();
      await new Hono()
        .use("*", requestContextMiddleware)
        .get("/artists/:accountId", () => {
          throw error;
        })
        .onError(createAppErrorHandler(logger))
        .request("/artists/beatboxer_taro", { headers });
      expect(logs).toHaveLength(1);
      return logs[0];
    };

    it("requestId と traceId をログに載せる", async () => {
      const traceId = "4bf92f3577b34da6a3ce929d0e0e4736";

      const log = await requestWithContext(createUnauthorizedError(), {
        "x-request-id": "req-1",
        traceparent: `00-${traceId}-00f067aa0ba902b7-01`,
      });

      expect(log.fields).toStrictEqual({
        requestId: "req-1",
        traceId,
        method: "GET",
        route: "/artists/:accountId",
        errorType: "UnauthorizedError",
        status: 401,
      });
    });

    it("route はパス値ではなくルートパターンを載せる", async () => {
      const log = await requestWithContext(createUnauthorizedError(), {});

      expect(log.fields.route).toBe("/artists/:accountId");
      expect(JSON.stringify(log.fields)).not.toContain("beatboxer_taro");
    });

    it("相関ヘッダが無くても requestId は確定する", async () => {
      const log = await requestWithContext(createUnauthorizedError(), {});

      expect(log.fields.requestId).toBeTruthy();
      expect(log.fields).not.toHaveProperty("traceId");
    });

    it("リクエストコンテキスト外でも method / route だけでログを残す", async () => {
      const log = await logOf(createUnauthorizedError());

      expect(log.fields).not.toHaveProperty("requestId");
      expect(log.fields).toMatchObject({ method: "GET", route: "/" });
    });
  });

  describe("壊れたリクエストボディ", () => {
    const postMalformedJson = async () => {
      const { logger, logs } = createRecordingLogger();
      const response = await new Hono()
        .post(
          "/",
          validateRequest("json", z.object({ name: z.string() })),
          (c) => c.json(c.req.valid("json")),
        )
        .onError(createAppErrorHandler(logger))
        .request("/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{ not json",
        });
      return { response, logs };
    };

    it("パースできないボディをクライアント起因の 400 として返す", async () => {
      const { response } = await postMalformedJson();

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({
        error: "Malformed request body",
      });
    });

    it("パースできないボディを info で記録し error のログを出さない", async () => {
      const { logs } = await postMalformedJson();

      expect(logs).toStrictEqual([
        {
          level: "info",
          event: "AppError",
          fields: {
            ...REQUEST_FIELDS,
            method: "POST",
            errorType: "MalformedRequestBodyError",
            status: 400,
          },
        },
      ]);
    });
  });
});

describe("handleAppError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const requestWithDefaultHandler = async (error: unknown) =>
    new Hono()
      .get("/", () => {
        throw error;
      })
      .onError(handleAppError)
      .request("/");

  it("既定の logger として console を使い logLevel に対応するメソッドへ出力する", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    await requestWithDefaultHandler(createUserAlreadyRegisteredError());

    expect(infoSpy).toHaveBeenCalledWith(
      JSON.stringify({
        level: "info",
        event: "AppError",
        method: "GET",
        route: "/",
        errorType: "UserAlreadyRegisteredError",
        status: 409,
      }),
    );
  });

  it("未知のエラーは console.error へ出力する", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const rawError = new Error("boom");

    await requestWithDefaultHandler(rawError);

    expect(errorSpy).toHaveBeenCalledWith(
      JSON.stringify({
        level: "error",
        event: "UnhandledError",
        method: "GET",
        route: "/",
        errorName: "Error",
        message: "boom",
        stack: rawError.stack,
      }),
    );
  });
});
