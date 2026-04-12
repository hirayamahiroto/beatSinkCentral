export type AccountIdAlreadyTakenError = Error & {
  readonly type: "AccountIdAlreadyTakenError";
  readonly accountId: string;
};

export const createAccountIdAlreadyTakenError = (
  accountId: string
): AccountIdAlreadyTakenError => {
  const error = new Error(
    `Account ID already taken: ${accountId}`
  ) as AccountIdAlreadyTakenError;
  return Object.assign(error, {
    type: "AccountIdAlreadyTakenError" as const,
    accountId,
  });
};

export const isAccountIdAlreadyTakenError = (
  error: unknown
): error is AccountIdAlreadyTakenError => {
  return (
    error instanceof Error &&
    (error as Partial<AccountIdAlreadyTakenError>).type ===
      "AccountIdAlreadyTakenError"
  );
};
