import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { UserAlreadyRegisteredError } from "../domain/users/policies/assertNotRegistered";
import type { UserNotFoundError } from "../domain/users/policies/assertRegistered";
import type { AccountIdAlreadyTakenError } from "../domain/artists/policies/assertAccountIdAvailable";
import type { ArtistNotFoundError } from "../domain/artists/policies/assertArtistExists";
import type { InvalidEmailFormatError } from "../domain/users/valueObjects/email";
import type { InvalidSubFormatError } from "../domain/users/valueObjects/sub";
import type { InvalidNameFormatError } from "../domain/users/valueObjects/name";
import type { InvalidAccountIdFormatError } from "../domain/artists/valueObjects/accountId";
import type { InvalidArtistIdFormatError } from "../domain/artists/valueObjects/artistId";
import type { ArtistProfileNotFoundError } from "../domain/artistProfiles/policies/assertArtistProfileExists";
import type { ProfileNotPublishableError } from "../domain/artistProfiles/policies/assertProfilePublishable";
import type { InvalidProfileNameFormatError } from "../domain/artistProfiles/valueObjects/profileName";
import type { InvalidTaglineFormatError } from "../domain/artistProfiles/valueObjects/tagline";
import type { InvalidImageUrlFormatError } from "../domain/artistProfiles/valueObjects/imageUrl";
import type { InvalidStoryFormatError } from "../domain/artistProfiles/valueObjects/story";
import type { InvalidActivityInfoFormatError } from "../domain/artistProfiles/valueObjects/activityInfo";
import type { InvalidGenreFormatError } from "../domain/artistProfiles/valueObjects/genre";
import type { InvalidSnsUrlFormatError } from "../domain/artistProfiles/valueObjects/snsUrl";
import type { InvalidRequestFormatError } from "../app/api/[[...route]]/errors/invalidRequestFormat";
import type { UnauthorizedError } from "../middlewares/auth0/errors/unauthorized";

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
  | InvalidSnsUrlFormatError;

type ErrorMapping<SpecificError extends AppError> = {
  status: ContentfulStatusCode;
  message: (error: SpecificError) => string;
  details?: (error: SpecificError) => unknown;
};

type ErrorMap = {
  [ErrorType in AppError["type"]]: ErrorMapping<
    Extract<AppError, { type: ErrorType }>
  >;
};

const errorMap: ErrorMap = {
  InvalidRequestFormatError: {
    status: 400,
    message: () => "Invalid request",
    details: (error) => error.issues,
  },
  UnauthorizedError: {
    status: 401,
    message: () => "Unauthorized",
  },
  UserAlreadyRegisteredError: {
    status: 409,
    message: () => "User already registered",
  },
  UserNotFoundError: {
    status: 404,
    message: () => "User not found",
  },
  AccountIdAlreadyTakenError: {
    status: 409,
    message: (error) => `Account ID already taken: ${error.accountId}`,
  },
  ArtistNotFoundError: {
    status: 404,
    message: () => "Artist not found",
  },
  InvalidEmailFormatError: {
    status: 422,
    message: () => "Invalid email format",
  },
  InvalidSubFormatError: {
    status: 422,
    message: () => "Invalid sub format",
  },
  InvalidNameFormatError: {
    status: 422,
    message: () => "Invalid name format",
  },
  InvalidAccountIdFormatError: {
    status: 422,
    message: () => "Invalid accountId format",
  },
  InvalidArtistIdFormatError: {
    status: 422,
    message: () => "Invalid artistId format",
  },
  ArtistProfileNotFoundError: {
    status: 404,
    message: () => "Artist profile not found",
  },
  ProfileNotPublishableError: {
    status: 422,
    message: () => "Profile is not publishable: required fields are missing",
    details: (error) => ({ missingFields: error.missingFields }),
  },
  InvalidProfileNameFormatError: {
    status: 422,
    message: () => "Invalid name format",
  },
  InvalidTaglineFormatError: {
    status: 422,
    message: () => "Invalid tagline format",
  },
  InvalidImageUrlFormatError: {
    status: 422,
    message: () => "Invalid imageUrl format",
  },
  InvalidStoryFormatError: {
    status: 422,
    message: () => "Invalid story format",
  },
  InvalidActivityInfoFormatError: {
    status: 422,
    message: () => "Invalid activityInfo format",
  },
  InvalidGenreFormatError: {
    status: 422,
    message: () => "Invalid genre format",
  },
  InvalidSnsUrlFormatError: {
    status: 422,
    message: () => "Invalid snsUrl format",
  },
};

const isAppError = (error: unknown): error is AppError => {
  if (!(error instanceof Error)) return false;
  const type = (error as { type?: unknown }).type;
  return typeof type === "string" && type in errorMap;
};

const buildMappedResponse = <Error extends AppError>(
  error: Error,
): ErrorResponse => {
  const mapping = errorMap[error.type as Error["type"]] as ErrorMapping<Error>;
  const body: ErrorResponse["body"] = { error: mapping.message(error) };
  if (mapping.details) {
    body.details = mapping.details(error);
  }
  return {
    body,
    status: mapping.status,
  };
};

type ErrorResponse = {
  body: { error: string; details?: unknown };
  status: ContentfulStatusCode;
};

const resolveErrorResponse = (error: unknown): ErrorResponse => {
  if (isAppError(error)) {
    const response = buildMappedResponse(error);
    console.warn("[AppError]", {
      type: error.type,
      status: response.status,
      message: error.message,
    });
    return response;
  }
  console.error("[Unhandled error]", error);
  return {
    body: { error: "Internal Server Error" },
    status: 500,
  };
};

export const handleAppError = (error: Error, c: Context) => {
  const { body, status } = resolveErrorResponse(error);
  return c.json(body, status);
};
