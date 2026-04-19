import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { UserAlreadyRegisteredError } from "../domain/users/policies/assertNotRegistered";
import type { AccountIdAlreadyTakenError } from "../domain/artists/errors";
import type { InvalidEmailFormatError } from "../domain/users/valueObjects/email";
import type { InvalidSubFormatError } from "../domain/users/valueObjects/sub";
import type { InvalidNameFormatError } from "../domain/users/valueObjects/name";
import type { InvalidAccountIdFormatError } from "../domain/artists/valueObjects/accountId";
import type { InvalidArtistIdFormatError } from "../domain/artists/valueObjects/artistId";

export type AppError =
  | UserAlreadyRegisteredError
  | AccountIdAlreadyTakenError
  | InvalidEmailFormatError
  | InvalidSubFormatError
  | InvalidNameFormatError
  | InvalidAccountIdFormatError
  | InvalidArtistIdFormatError;

type ErrorMapping<SpecificError extends AppError> = {
  status: ContentfulStatusCode;
  message: (error: SpecificError) => string;
};

type ErrorMap = {
  [ErrorType in AppError["type"]]: ErrorMapping<
    Extract<AppError, { type: ErrorType }>
  >;
};

const errorMap: ErrorMap = {
  UserAlreadyRegisteredError: {
    status: 409,
    message: () => "User already registered",
  },
  AccountIdAlreadyTakenError: {
    status: 409,
    message: (error) => `Account ID already taken: ${error.accountId}`,
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
};

const isAppError = (error: unknown): error is AppError => {
  if (!(error instanceof Error)) return false;
  const type = (error as { type?: unknown }).type;
  return typeof type === "string" && type in errorMap;
};

const buildMappedResponse = <Error extends AppError>(
  error: Error
): ErrorResponse => {
  const mapping = errorMap[error.type as Error["type"]] as ErrorMapping<Error>;
  return {
    body: { error: mapping.message(error) },
    status: mapping.status,
  };
};

export type ErrorResponse = {
  body: { error: string };
  status: ContentfulStatusCode;
};

export const resolveErrorResponse = (error: unknown): ErrorResponse => {
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
