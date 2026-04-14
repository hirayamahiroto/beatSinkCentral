import type { User } from "../../entities";

export type UserAlreadyRegisteredError = Error & {
  readonly type: "UserAlreadyRegisteredError";
};

export const createUserAlreadyRegisteredError =
  (): UserAlreadyRegisteredError => {
    const error = new Error(
      "User already registered"
    ) as UserAlreadyRegisteredError;
    return Object.assign(error, {
      type: "UserAlreadyRegisteredError" as const,
    });
  };

export const isUserAlreadyRegisteredError = (
  error: unknown
): error is UserAlreadyRegisteredError => {
  return (
    error instanceof Error &&
    (error as Partial<UserAlreadyRegisteredError>).type ===
      "UserAlreadyRegisteredError"
  );
};

export const assertNotRegistered = (userIfRegistered: User | null): void => {
  if (userIfRegistered) {
    throw createUserAlreadyRegisteredError();
  }
};
