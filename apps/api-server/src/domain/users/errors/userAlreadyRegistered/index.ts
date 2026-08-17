import { createTypedError } from "../../../../utils/errors/createTypedError";

export type UserAlreadyRegisteredError = Error & {
  readonly type: "UserAlreadyRegisteredError";
};

export const createUserAlreadyRegisteredError =
  (): UserAlreadyRegisteredError =>
    createTypedError("UserAlreadyRegisteredError");

export const isUserAlreadyRegisteredError = (
  error: unknown,
): error is UserAlreadyRegisteredError => {
  return (
    error instanceof Error &&
    (error as Partial<UserAlreadyRegisteredError>).type ===
      "UserAlreadyRegisteredError"
  );
};
