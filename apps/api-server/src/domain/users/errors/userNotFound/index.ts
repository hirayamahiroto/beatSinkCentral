import { createTypedError } from "../../../../utils/errors/createTypedError";

export type UserNotFoundError = Error & {
  readonly type: "UserNotFoundError";
};

export const createUserNotFoundError = (): UserNotFoundError =>
  createTypedError("UserNotFoundError");

export const isUserNotFoundError = (
  error: unknown,
): error is UserNotFoundError =>
  error instanceof Error &&
  "type" in error &&
  error.type === "UserNotFoundError";
