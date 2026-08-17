import { createTypedError } from "../../../../utils/errors/createTypedError";

export type UserNotFoundError = Error & {
  readonly type: "UserNotFoundError";
};

export const createUserNotFoundError = (): UserNotFoundError =>
  createTypedError("UserNotFoundError");

export const isUserNotFoundError = (
  error: unknown,
): error is UserNotFoundError => {
  return (
    error instanceof Error &&
    (error as Partial<UserNotFoundError>).type === "UserNotFoundError"
  );
};
