import type { Context } from "hono";
import type {
  ClientErrorStatusCode,
  ServerErrorStatusCode,
} from "hono/utils/http-status";
import type { UpstreamUnavailableError } from "../utils/client/errors/upstreamUnavailable";
import type { UpstreamServerError } from "../app/api/[[...route]]/errors/upstreamServerError";
import type { UpstreamContractViolationError } from "../app/api/[[...route]]/errors/upstreamContractViolation";
import type { UpstreamRejectedError } from "../app/api/[[...route]]/errors/upstreamRejected";
import type { InvalidRequestFormatError } from "../app/api/[[...route]]/errors/invalidRequestFormat";
import type { MyUserNotFoundError } from "../app/api/[[...route]]/errors/myUserNotFound";
import type { MyArtistNotFoundError } from "../app/api/[[...route]]/errors/myArtistNotFound";
import type { PlayerNotFoundError } from "../app/api/[[...route]]/errors/playerNotFound";
import type { PartialSaveFailedError } from "../app/api/[[...route]]/errors/partialSaveFailed";
import { translateUpstreamBody } from "./translateUpstreamBody";
import { createErrorChannel } from "../utils/errors/errorChannel";

export type BffError =
  | UpstreamUnavailableError
  | UpstreamServerError
  | UpstreamContractViolationError
  | UpstreamRejectedError
  | InvalidRequestFormatError
  | MyUserNotFoundError
  | MyArtistNotFoundError
  | PlayerNotFoundError
  | PartialSaveFailedError;

type ErrorStatusCode = ClientErrorStatusCode | ServerErrorStatusCode;

type ErrorBody = { error: string } & Record<string, unknown>;

type LogLevel = "info" | "warn" | "error";

type ErrorMapping<SpecificError extends BffError> = {
  status: (error: SpecificError) => ErrorStatusCode;
  body: (error: SpecificError) => ErrorBody;
  logLevel: (error: SpecificError) => LogLevel;
};

type ErrorType = BffError["type"];

type ErrorOf<Type extends ErrorType> = Extract<BffError, { type: Type }>;

type ErrorMap = {
  [Type in ErrorType]: ErrorMapping<ErrorOf<Type>>;
};

type ErrorResponse = {
  body: ErrorBody;
  status: ErrorStatusCode;
};

const bffError = createErrorChannel<BffError>();

export const throwBffError: (error: BffError) => never = bffError.raise;

export const recoverBffError = bffError.recover;

const statusOf = <Type extends ErrorType>(
  type: Type,
  error: ErrorOf<Type>,
): ErrorStatusCode => errorMap[type].status(error);

const bodyOf = <Type extends ErrorType>(
  type: Type,
  error: ErrorOf<Type>,
): ErrorBody => errorMap[type].body(error);

const logLevelOf = <Type extends ErrorType>(
  type: Type,
  error: ErrorOf<Type>,
): LogLevel => errorMap[type].logLevel(error);

const errorMap: ErrorMap = {
  UpstreamUnavailableError: {
    status: () => 502,
    body: (error) => ({ error: "Upstream request failed", code: error.type }),
    logLevel: () => "warn",
  },
  UpstreamServerError: {
    status: () => 502,
    body: (error) => ({ error: "Upstream request failed", code: error.type }),
    logLevel: () => "warn",
  },
  UpstreamContractViolationError: {
    status: () => 502,
    body: (error) => ({
      error: "Upstream response violated contract",
      code: error.type,
    }),
    logLevel: () => "error",
  },
  UpstreamRejectedError: {
    status: (error) => error.status,
    body: (error) => translateUpstreamBody(error.body),
    logLevel: () => "info",
  },
  InvalidRequestFormatError: {
    status: () => 400,
    body: (error) => ({
      error: "Invalid request",
      code: error.type,
      issues: error.issues,
    }),
    logLevel: () => "info",
  },
  MyUserNotFoundError: {
    status: () => 404,
    body: (error) => ({ error: "User not found", code: error.type }),
    logLevel: () => "info",
  },
  MyArtistNotFoundError: {
    status: () => 404,
    body: (error) => ({ error: "Artist not found", code: error.type }),
    logLevel: () => "info",
  },
  PlayerNotFoundError: {
    status: () => 404,
    body: (error) => ({ error: "Player profile not found", code: error.type }),
    logLevel: () => "info",
  },
  PartialSaveFailedError: {
    status: (error) => statusOf(error.upstream.type, error.upstream),
    body: (error) => ({
      ...bodyOf(error.upstream.type, error.upstream),
      saved: error.saved,
      failedAt: error.failedAt,
    }),
    logLevel: (error) => logLevelOf(error.upstream.type, error.upstream),
  },
};

const resolveErrorResponse = (error: unknown): ErrorResponse => {
  const recovered = bffError.recover(error);
  if (recovered !== null) {
    const status = statusOf(recovered.type, recovered);
    console[logLevelOf(recovered.type, recovered)]("[BffError]", {
      type: recovered.type,
      status,
      cause: recovered.cause,
    });
    return { body: bodyOf(recovered.type, recovered), status };
  }
  console.error("[Unhandled error]", error);
  return {
    body: { error: "Internal Server Error" },
    status: 500,
  };
};

export const handleBffError = (error: Error, c: Context) => {
  const { body, status } = resolveErrorResponse(error);
  return c.json(body, status);
};
