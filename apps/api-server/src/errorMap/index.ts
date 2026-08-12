import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type {
  ClientErrorStatusCode,
  ServerErrorStatusCode,
} from "hono/utils/http-status";
import type { UserAlreadyRegisteredError } from "../domain/users/errors/userAlreadyRegistered";
import type { UserNotFoundError } from "../domain/users/errors/userNotFound";
import type { AccountIdAlreadyTakenError } from "../domain/artists/errors/accountIdAlreadyTaken";
import type { ArtistNotFoundError } from "../domain/artists/errors/artistNotFound";
import type { InvalidEmailFormatError } from "../domain/users/valueObjects/email";
import type { InvalidSubFormatError } from "../domain/users/valueObjects/sub";
import type { InvalidNameFormatError } from "../domain/users/valueObjects/name";
import type { InvalidAccountIdFormatError } from "../domain/artists/valueObjects/accountId";
import type { InvalidArtistIdFormatError } from "../domain/artists/valueObjects/artistId";
import type { ArtistProfileNotFoundError } from "../domain/artistProfiles/errors/artistProfileNotFound";
import type { ProfileNotPublishableError } from "../domain/artistProfiles/policies/publishability";
import type { InvalidProfileNameFormatError } from "../domain/artistProfiles/valueObjects/profileName";
import type { InvalidTaglineFormatError } from "../domain/artistProfiles/valueObjects/tagline";
import type { InvalidImageUrlFormatError } from "../domain/artistProfiles/valueObjects/imageUrl";
import type { InvalidStoryFormatError } from "../domain/artistProfiles/valueObjects/story";
import type { InvalidActivityInfoFormatError } from "../domain/artistProfiles/valueObjects/activityInfo";
import type { InvalidGenreFormatError } from "../domain/artistProfiles/valueObjects/genre";
import type { InvalidSnsUrlFormatError } from "../domain/artistProfiles/valueObjects/snsUrl";
import type { InvalidProfileLinkFormatError } from "../domain/artistProfiles/valueObjects/profileLink";
import type { InvalidRequestFormatError } from "../routes/errors/invalidRequestFormat";
import type { UnauthorizedError } from "../middlewares/auth0/errors/unauthorized";
import type { LogFields, LogLevel, Logger } from "../utils/logger";
import { createConsoleLogger } from "../utils/logger";
import { getRequestContext } from "../utils/requestContext";

export type AppError =
  | InvalidRequestFormatError
  | UnauthorizedError
  | UserAlreadyRegisteredError
  | UserNotFoundError
  | AccountIdAlreadyTakenError
  | ArtistNotFoundError
  | ArtistProfileNotFoundError
  | ProfileNotPublishableError
  | InvalidEmailFormatError
  | InvalidSubFormatError
  | InvalidNameFormatError
  | InvalidAccountIdFormatError
  | InvalidArtistIdFormatError
  | InvalidProfileNameFormatError
  | InvalidTaglineFormatError
  | InvalidImageUrlFormatError
  | InvalidStoryFormatError
  | InvalidActivityInfoFormatError
  | InvalidGenreFormatError
  | InvalidSnsUrlFormatError
  | InvalidProfileLinkFormatError;

type ErrorStatusCode = ClientErrorStatusCode | ServerErrorStatusCode;

type ErrorMapping<SpecificError extends AppError> = {
  status: ErrorStatusCode;
  clientMessage: (error: SpecificError) => string;
  clientDetails?: (error: SpecificError) => unknown;
  logLevel: LogLevel;
  logFields?: (error: SpecificError) => LogFields;
};

type ErrorMap = {
  [ErrorType in AppError["type"]]: ErrorMapping<
    Extract<AppError, { type: ErrorType }>
  >;
};

const errorMap: ErrorMap = {
  InvalidRequestFormatError: {
    status: 400,
    clientMessage: () => "Invalid request",
    clientDetails: (error) => error.issues,
    logLevel: "info",
    logFields: (error) => ({
      issuePaths: error.issues.map((issue) => issue.path.join(".")),
    }),
  },
  UnauthorizedError: {
    status: 401,
    clientMessage: () => "Unauthorized",
    logLevel: "warn",
  },
  UserAlreadyRegisteredError: {
    status: 409,
    clientMessage: () => "User already registered",
    logLevel: "info",
  },
  UserNotFoundError: {
    status: 404,
    clientMessage: () => "User not found",
    logLevel: "info",
  },
  AccountIdAlreadyTakenError: {
    status: 409,
    clientMessage: (error) => `Account ID already taken: ${error.accountId}`,
    logLevel: "info",
    logFields: (error) => ({ accountId: error.accountId }),
  },
  ArtistNotFoundError: {
    status: 404,
    clientMessage: () => "Artist not found",
    logLevel: "info",
  },
  InvalidEmailFormatError: {
    status: 422,
    clientMessage: () => "Invalid email format",
    logLevel: "info",
  },
  InvalidSubFormatError: {
    status: 422,
    clientMessage: () => "Invalid sub format",
    logLevel: "warn",
  },
  InvalidNameFormatError: {
    status: 422,
    clientMessage: () => "Invalid name format",
    logLevel: "info",
  },
  InvalidAccountIdFormatError: {
    status: 422,
    clientMessage: () => "Invalid accountId format",
    logLevel: "info",
  },
  InvalidArtistIdFormatError: {
    status: 422,
    clientMessage: () => "Invalid artistId format",
    logLevel: "info",
  },
  ArtistProfileNotFoundError: {
    status: 404,
    clientMessage: () => "Artist profile not found",
    logLevel: "info",
  },
  ProfileNotPublishableError: {
    status: 422,
    clientMessage: () =>
      "Profile is not publishable: required fields are missing",
    clientDetails: (error) => ({ missingFields: error.missingFields }),
    logLevel: "info",
    logFields: (error) => ({ missingFields: error.missingFields }),
  },
  InvalidProfileNameFormatError: {
    status: 422,
    clientMessage: () => "Invalid name format",
    logLevel: "info",
  },
  InvalidTaglineFormatError: {
    status: 422,
    clientMessage: () => "Invalid tagline format",
    logLevel: "info",
  },
  InvalidImageUrlFormatError: {
    status: 422,
    clientMessage: () => "Invalid imageUrl format",
    logLevel: "info",
  },
  InvalidStoryFormatError: {
    status: 422,
    clientMessage: () => "Invalid story format",
    logLevel: "info",
  },
  InvalidActivityInfoFormatError: {
    status: 422,
    clientMessage: () => "Invalid activityInfo format",
    logLevel: "info",
  },
  InvalidGenreFormatError: {
    status: 422,
    clientMessage: () => "Invalid genre format",
    logLevel: "info",
  },
  InvalidSnsUrlFormatError: {
    status: 422,
    clientMessage: () => "Invalid snsUrl format",
    logLevel: "info",
  },
  InvalidProfileLinkFormatError: {
    status: 422,
    clientMessage: () => "Invalid profile link format",
    logLevel: "info",
  },
};

const isAppError = (error: unknown): error is AppError => {
  if (!(error instanceof Error)) return false;
  const type = (error as { type?: unknown }).type;
  return typeof type === "string" && type in errorMap;
};

type ClientResponse = {
  body: { error: string; details?: unknown };
  status: ErrorStatusCode;
};

type ErrorLog = {
  level: LogLevel;
  event: string;
  fields: LogFields;
};

const APP_ERROR_EVENT = "AppError";
const HTTP_EXCEPTION_EVENT = "HttpException";
const UNHANDLED_ERROR_EVENT = "UnhandledError";

const resolveMapping = <SpecificError extends AppError>(
  error: SpecificError,
): ErrorMapping<SpecificError> =>
  errorMap[error.type as SpecificError["type"]] as ErrorMapping<SpecificError>;

const buildClientResponse = <SpecificError extends AppError>(
  error: SpecificError,
): ClientResponse => {
  const mapping = resolveMapping(error);
  const body: ClientResponse["body"] = { error: mapping.clientMessage(error) };
  if (mapping.clientDetails) {
    body.details = mapping.clientDetails(error);
  }
  return {
    body,
    status: mapping.status,
  };
};

const buildErrorLog = <SpecificError extends AppError>(
  error: SpecificError,
): ErrorLog => {
  const mapping = resolveMapping(error);
  const fields: LogFields = {
    errorType: error.type,
    status: mapping.status,
  };
  if (mapping.logFields) {
    fields.context = mapping.logFields(error);
  }
  return {
    level: mapping.logLevel,
    event: APP_ERROR_EVENT,
    fields,
  };
};

const buildHttpExceptionLog = (error: HTTPException): ErrorLog => ({
  level: "warn",
  event: HTTP_EXCEPTION_EVENT,
  fields: {
    status: error.status,
  },
});

const buildUnhandledErrorLog = (error: Error): ErrorLog => ({
  level: "error",
  event: UNHANDLED_ERROR_EVENT,
  fields: {
    errorName: error.name,
    message: error.message,
    stack: error.stack,
  },
});

const emit = (
  logger: Logger,
  c: Context,
  { level, event, fields }: ErrorLog,
): void => {
  logger[level](event, {
    ...getRequestContext(),
    method: c.req.method,
    // Hono の routePath は middleware 実行時点では自身のパターン（/api/*）を返すため、ルータ解決後の c から読む
    route: c.req.routePath,
    ...fields,
  });
};

export const createAppErrorHandler =
  (logger: Logger) => (error: Error, c: Context) => {
    if (isAppError(error)) {
      emit(logger, c, buildErrorLog(error));
      const { body, status } = buildClientResponse(error);
      return c.json(body, status);
    }
    emit(logger, c, buildUnhandledErrorLog(error));
    return c.json({ error: "Internal Server Error" }, 500);
  };

export const createRequestErrorHandler =
  (logger: Logger) =>
  (error: Error, c: Context): Response => {
    if (error instanceof HTTPException) {
      emit(logger, c, buildHttpExceptionLog(error));
      return error.getResponse();
    }
    return createAppErrorHandler(logger)(error, c);
  };

export const handleAppError = createAppErrorHandler(createConsoleLogger());

export const handleRequestError = createRequestErrorHandler(
  createConsoleLogger(),
);
