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
import { translateUpstreamBody } from "./translateUpstreamBody";

export type BffError =
  | UpstreamUnavailableError
  | UpstreamServerError
  | UpstreamContractViolationError
  | UpstreamRejectedError
  | InvalidRequestFormatError
  | MyUserNotFoundError
  | MyArtistNotFoundError
  | PlayerNotFoundError;

type ErrorStatusCode = ClientErrorStatusCode | ServerErrorStatusCode;

type ErrorBody = { error: string } & Record<string, unknown>;

type LogLevel = "info" | "warn" | "error";

type ErrorMapping<SpecificError extends BffError> = {
  status: (error: SpecificError) => ErrorStatusCode;
  body: (error: SpecificError) => ErrorBody;
  logLevel: LogLevel;
};

type ErrorMap = {
  [ErrorType in BffError["type"]]: ErrorMapping<
    Extract<BffError, { type: ErrorType }>
  >;
};

const errorMap: ErrorMap = {
  UpstreamUnavailableError: {
    status: () => 502,
    body: (error) => ({ error: "Upstream request failed", code: error.type }),
    logLevel: "warn",
  },
  UpstreamServerError: {
    status: () => 502,
    body: (error) => ({ error: "Upstream request failed", code: error.type }),
    logLevel: "warn",
  },
  UpstreamContractViolationError: {
    status: () => 502,
    body: (error) => ({
      error: "Upstream response violated contract",
      code: error.type,
    }),
    logLevel: "error",
  },
  UpstreamRejectedError: {
    status: (error) => error.status,
    body: (error) => translateUpstreamBody(error.body),
    logLevel: "info",
  },
  InvalidRequestFormatError: {
    status: () => 400,
    body: (error) => ({
      error: "Invalid request",
      code: error.type,
      issues: error.issues,
    }),
    logLevel: "info",
  },
  MyUserNotFoundError: {
    status: () => 404,
    body: (error) => ({ error: "User not found", code: error.type }),
    logLevel: "info",
  },
  MyArtistNotFoundError: {
    status: () => 404,
    body: (error) => ({ error: "Artist not found", code: error.type }),
    logLevel: "info",
  },
  PlayerNotFoundError: {
    status: () => 404,
    body: (error) => ({ error: "Player profile not found", code: error.type }),
    logLevel: "info",
  },
};

type ErrorResponse = {
  body: ErrorBody;
  status: ErrorStatusCode;
};

const isBffError = (error: unknown): error is BffError => {
  if (!(error instanceof Error) || !("type" in error)) return false;
  return typeof error.type === "string" && Object.hasOwn(errorMap, error.type);
};

const resolveMapping = <SpecificError extends BffError>(
  error: SpecificError,
): ErrorMapping<SpecificError> =>
  errorMap[error.type as SpecificError["type"]] as ErrorMapping<SpecificError>;

const buildMappedResponse = (error: BffError): ErrorResponse => {
  const mapping = resolveMapping(error);
  return { body: mapping.body(error), status: mapping.status(error) };
};

const logMapped = (error: BffError, status: ErrorStatusCode): void => {
  const mapping = resolveMapping(error);
  console[mapping.logLevel]("[BffError]", {
    type: error.type,
    status,
    cause: error.cause,
  });
};

const resolveErrorResponse = (error: unknown): ErrorResponse => {
  if (isBffError(error)) {
    const response = buildMappedResponse(error);
    logMapped(error, response.status);
    return response;
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
