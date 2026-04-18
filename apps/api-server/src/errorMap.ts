import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { UserAlreadyRegisteredError } from "./domain/users/policies/assertNotRegistered";
import type { AccountIdAlreadyTakenError } from "./domain/artists/errors";

type AppError = UserAlreadyRegisteredError | AccountIdAlreadyTakenError;

type ErrorMapping<SpecificError extends AppError> = {
  status: ContentfulStatusCode;
  message: (error: SpecificError) => string;
};

const errorMap: {
  [ErrorType in AppError["type"]]: ErrorMapping<
    Extract<AppError, { type: ErrorType }>
  >;
} = {
  UserAlreadyRegisteredError: {
    status: 409,
    message: () => "User already registered",
  },
  AccountIdAlreadyTakenError: {
    status: 409,
    message: (error) => `Account ID already taken: ${error.accountId}`,
  },
};

const isAppError = (error: unknown): error is AppError => {
  if (!(error instanceof Error)) return false;
  const type = (error as { type?: unknown }).type;
  return typeof type === "string" && type in errorMap;
};

export type ErrorResponse = {
  body: { error: string };
  status: ContentfulStatusCode;
};

export const resolveErrorResponse = (error: unknown): ErrorResponse => {
  if (isAppError(error)) {
    const mapping = errorMap[error.type];
    return {
      body: { error: mapping.message(error as never) },
      status: mapping.status,
    };
  }
  console.error("[Unhandled error]", error);
  return {
    body: { error: "Internal Server Error" },
    status: 500,
  };
};
