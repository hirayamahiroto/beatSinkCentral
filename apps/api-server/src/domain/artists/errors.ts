import { createTypedError } from "../../utils/errors/createTypedError";

export type AccountIdAlreadyTakenError = Error & {
  readonly type: "AccountIdAlreadyTakenError";
  readonly accountId: string;
};

export const createAccountIdAlreadyTakenError = (
  accountId: string
): AccountIdAlreadyTakenError =>
  createTypedError("AccountIdAlreadyTakenError", { accountId });

export const isAccountIdAlreadyTakenError = (
  error: unknown
): error is AccountIdAlreadyTakenError => {
  return (
    error instanceof Error &&
    (error as Partial<AccountIdAlreadyTakenError>).type ===
      "AccountIdAlreadyTakenError"
  );
};
