import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type {
  ClientErrorStatusCode,
  ServerErrorStatusCode,
} from "hono/utils/http-status";
import type { UserAlreadyRegisteredError } from "../../domain/users/errors/userAlreadyRegistered";
import type { UserNotFoundError } from "../../domain/users/errors/userNotFound";
import type { EmailAlreadyTakenError } from "../../domain/users/errors/emailAlreadyTaken";
import type { HandleAlreadyTakenError } from "../../domain/artists/errors/handleAlreadyTaken";
import type { ArtistNotFoundError } from "../../domain/artists/errors/artistNotFound";
import type { InvalidEmailFormatError } from "../../domain/users/valueObjects/email";
import type { InvalidSubFormatError } from "../../domain/users/valueObjects/sub";
import type { InvalidHandleFormatError } from "../../domain/artists/valueObjects/handle";
import type { InvalidArtistIdFormatError } from "../../domain/artists/valueObjects/artistId";
import type { ArtistProfileNotFoundError } from "../../domain/artistProfiles/errors/artistProfileNotFound";
import type { ProfileNotPublishableError } from "../../domain/artistProfiles/policies/publishability";
import type { InvalidProfileNameFormatError } from "../../domain/artistProfiles/valueObjects/profileName";
import type { InvalidTaglineFormatError } from "../../domain/artistProfiles/valueObjects/tagline";
import type { InvalidImageUrlFormatError } from "../../domain/artistProfiles/valueObjects/imageUrl";
import type {
  UnsupportedImageTypeError,
  ImageTooLargeError,
  EmptyImageFileError,
} from "../../domain/artistProfiles/valueObjects/profileImage";
import type { ProfileImageUploadFailedError } from "../../domain/artistProfiles/errors/profileImageUploadFailed";
import type { InvalidStoryChapterFormatError } from "../../domain/artistProfiles/valueObjects/storyChapter";
import type { InvalidActivityInfoFormatError } from "../../domain/artistProfiles/valueObjects/activityInfo";
import type { InvalidGenreFormatError } from "../../domain/artistProfiles/valueObjects/genre";
import type { InvalidSnsUrlFormatError } from "../../domain/artistProfiles/valueObjects/snsUrl";
import type { InvalidProfileLinkFormatError } from "../../domain/artistProfiles/valueObjects/profileLink";
import type { InvalidPresentationPatternError } from "../../domain/artistProfiles/valueObjects/presentationPattern";
import type { InvalidEventTypeFormatError } from "../../domain/analyticsEvents/valueObjects/eventType";
import type { InvalidCalendarDateFormatError } from "../../domain/offers/valueObjects/calendarDate";
import type { InvalidPlaceFormatError } from "../../domain/offers/valueObjects/place";
import type { InvalidTicketUrlFormatError } from "../../domain/offers/valueObjects/ticketUrl";
import type { InvalidOfferCommentFormatError } from "../../domain/offers/valueObjects/offerComment";
import type { InvalidCoPerformerFormatError } from "../../domain/offers/valueObjects/coPerformer";
import type { CoPerformerNotFoundError } from "../../domain/offers/errors/coPerformerNotFound";
import type { OfferDatePassedError } from "../../domain/offers/policies/activity";
import type { InvalidRequestFormatError } from "../../app/api/[[...route]]/errors/invalidRequestFormat";
import {
  createMalformedRequestBodyError,
  type MalformedRequestBodyError,
} from "../../app/api/[[...route]]/errors/malformedRequestBody";
import type { RequestBodyTooLargeError } from "../../app/api/[[...route]]/errors/requestBodyTooLarge";
import type { ResponseContractViolationError } from "../../app/api/[[...route]]/errors/responseContractViolation";
import type { UnauthorizedError } from "../../middlewares/auth0/errors/unauthorized";
import type { LogFields, LogLevel, Logger } from "../../utils/logger";
import { getRequestContext } from "../../utils/requestContext";

type AppError =
  | InvalidRequestFormatError
  | MalformedRequestBodyError
  | RequestBodyTooLargeError
  | ResponseContractViolationError
  | UnauthorizedError
  | UserAlreadyRegisteredError
  | UserNotFoundError
  | EmailAlreadyTakenError
  | HandleAlreadyTakenError
  | ArtistNotFoundError
  | ArtistProfileNotFoundError
  | ProfileNotPublishableError
  | InvalidEmailFormatError
  | InvalidSubFormatError
  | InvalidHandleFormatError
  | InvalidArtistIdFormatError
  | InvalidProfileNameFormatError
  | InvalidTaglineFormatError
  | InvalidImageUrlFormatError
  | InvalidStoryChapterFormatError
  | InvalidActivityInfoFormatError
  | InvalidGenreFormatError
  | InvalidSnsUrlFormatError
  | InvalidProfileLinkFormatError
  | InvalidPresentationPatternError
  | InvalidEventTypeFormatError
  | InvalidCalendarDateFormatError
  | InvalidPlaceFormatError
  | InvalidTicketUrlFormatError
  | InvalidOfferCommentFormatError
  | InvalidCoPerformerFormatError
  | CoPerformerNotFoundError
  | OfferDatePassedError
  | UnsupportedImageTypeError
  | ImageTooLargeError
  | EmptyImageFileError
  | ProfileImageUploadFailedError;

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
  MalformedRequestBodyError: {
    status: 400,
    clientMessage: () => "Malformed request body",
    logLevel: "info",
  },
  RequestBodyTooLargeError: {
    status: 413,
    clientMessage: () => "Request body is too large",
    logLevel: "info",
  },
  ResponseContractViolationError: {
    status: 500,
    clientMessage: () => "Internal Server Error",
    logLevel: "error",
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
  EmailAlreadyTakenError: {
    status: 409,
    clientMessage: () => "Email already taken",
    logLevel: "info",
  },
  HandleAlreadyTakenError: {
    status: 409,
    clientMessage: (error) => `Handle already taken: ${error.handle}`,
    logLevel: "info",
    logFields: (error) => ({ handle: error.handle }),
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
  InvalidHandleFormatError: {
    status: 422,
    clientMessage: () => "Invalid handle format",
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
  InvalidStoryChapterFormatError: {
    status: 422,
    clientMessage: () => "Invalid story chapter format",
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
  InvalidPresentationPatternError: {
    status: 422,
    clientMessage: () => "Invalid presentation pattern",
    logLevel: "info",
  },
  InvalidEventTypeFormatError: {
    status: 422,
    clientMessage: () => "Invalid event type",
    logLevel: "info",
  },
  InvalidCalendarDateFormatError: {
    status: 422,
    clientMessage: () => "Invalid date format",
    logLevel: "info",
  },
  InvalidPlaceFormatError: {
    status: 422,
    clientMessage: () => "Invalid place format",
    logLevel: "info",
  },
  InvalidTicketUrlFormatError: {
    status: 422,
    clientMessage: () => "Invalid ticketUrl format",
    logLevel: "info",
  },
  InvalidOfferCommentFormatError: {
    status: 422,
    clientMessage: () => "Invalid comment format",
    logLevel: "info",
  },
  InvalidCoPerformerFormatError: {
    status: 422,
    clientMessage: () => "Invalid co-performer format",
    logLevel: "info",
  },
  CoPerformerNotFoundError: {
    status: 422,
    clientMessage: (error) => `Co-performer not found: ${error.handle}`,
    clientDetails: (error) => ({ handle: error.handle }),
    logLevel: "info",
    logFields: (error) => ({ handle: error.handle }),
  },
  OfferDatePassedError: {
    status: 422,
    clientMessage: () => "Offer date has already passed",
    logLevel: "info",
  },
  UnsupportedImageTypeError: {
    status: 422,
    clientMessage: () => "Unsupported image type",
    logLevel: "info",
  },
  ImageTooLargeError: {
    status: 413,
    clientMessage: () => "Image file is too large",
    logLevel: "info",
  },
  EmptyImageFileError: {
    status: 422,
    clientMessage: () => "Image file is empty",
    logLevel: "info",
  },
  ProfileImageUploadFailedError: {
    status: 502,
    clientMessage: () => "Failed to upload image",
    logLevel: "error",
    logFields: (error) => ({ reason: error.reason }),
  },
};

const isAppError = (error: unknown): error is AppError => {
  if (!(error instanceof Error) || !("type" in error)) return false;
  return typeof error.type === "string" && error.type in errorMap;
};

type ClientResponse = {
  body: { error: string; code: AppError["type"]; details?: unknown };
  status: ErrorStatusCode;
};

type ErrorLog = {
  level: LogLevel;
  event: string;
  fields: LogFields;
};

const APP_ERROR_EVENT = "AppError";
const UNHANDLED_ERROR_EVENT = "UnhandledError";

const resolveMapping = <SpecificError extends AppError>(
  error: SpecificError,
): ErrorMapping<SpecificError> =>
  errorMap[error.type as SpecificError["type"]] as ErrorMapping<SpecificError>;

const buildClientResponse = <SpecificError extends AppError>(
  error: SpecificError,
): ClientResponse => {
  const mapping = resolveMapping(error);
  const body: ClientResponse["body"] = {
    error: mapping.clientMessage(error),
    code: error.type,
  };
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

// Hono の validator はボディのパース失敗を HTTPException(400) で throw するため、
// AppError に載せ替えないと形式不正が想定外の例外（500 / level:error）に落ちる
const normalizeError = (error: Error): Error =>
  error instanceof HTTPException && error.status === 400
    ? createMalformedRequestBodyError()
    : error;

export const createAppErrorHandler =
  (logger: Logger) => (error: Error, c: Context) => {
    const normalized = normalizeError(error);
    if (isAppError(normalized)) {
      emit(logger, c, buildErrorLog(normalized));
      const { body, status } = buildClientResponse(normalized);
      return c.json(body, status);
    }
    emit(logger, c, buildUnhandledErrorLog(normalized));
    return c.json({ error: "Internal Server Error" }, 500);
  };
