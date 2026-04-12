export type UserAlreadyRegisteredError = Error & {
  readonly type: "UserAlreadyRegisteredError";
  readonly subId: string;
};

export const createUserAlreadyRegisteredError = (
  subId: string
): UserAlreadyRegisteredError => {
  const error = new Error(
    `User already registered: ${subId}`
  ) as UserAlreadyRegisteredError;
  return Object.assign(error, {
    type: "UserAlreadyRegisteredError" as const,
    subId,
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
