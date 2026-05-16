import type { User } from "../../entities";
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

export const assertRegistered: (user: User | null) => asserts user is User = (
  user,
) => {
  if (!user) {
    throw createUserNotFoundError();
  }
};
