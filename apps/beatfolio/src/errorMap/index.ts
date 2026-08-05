import type { Context } from "hono";
import type {
  ClientErrorStatusCode,
  ServerErrorStatusCode,
} from "hono/utils/http-status";
import type { UpstreamUnavailableError } from "../utils/client/errors/upstreamUnavailable";

export type BffError = UpstreamUnavailableError;

type ErrorStatusCode = ClientErrorStatusCode | ServerErrorStatusCode;

type ErrorMapping<SpecificError extends BffError> = {
  status: ErrorStatusCode;
  message: (error: SpecificError) => string;
};

type ErrorMap = {
  [ErrorType in BffError["type"]]: ErrorMapping<
    Extract<BffError, { type: ErrorType }>
  >;
};

const errorMap: ErrorMap = {
  UpstreamUnavailableError: {
    status: 502,
    message: () => "Upstream request failed",
  },
};

type ErrorResponse = {
  body: { error: string };
  status: ErrorStatusCode;
};

const isBffError = (error: unknown): error is BffError => {
  if (!(error instanceof Error)) return false;
  const type = (error as { type?: unknown }).type;
  return typeof type === "string" && type in errorMap;
};

const buildMappedResponse = <Error extends BffError>(
  error: Error,
): ErrorResponse => {
  const mapping = errorMap[error.type as Error["type"]] as ErrorMapping<Error>;
  return {
    body: { error: mapping.message(error) },
    status: mapping.status,
  };
};

const resolveErrorResponse = (error: unknown): ErrorResponse => {
  if (isBffError(error)) {
    const response = buildMappedResponse(error);
    console.warn("[BffError]", {
      type: error.type,
      status: response.status,
      cause: error.cause,
    });
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
