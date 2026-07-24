import { type Result, ok, err } from "../../../shared/result";

export type AccountId = {
  readonly _tag: "AccountId";
  readonly value: string;
};

export type InvalidAccountIdFormatError = {
  readonly type: "InvalidAccountIdFormatError";
};

const ACCOUNT_ID_REGEX = /^[a-zA-Z0-9_]+$/;

const isValidAccountId = (value: string): boolean =>
  value.length >= 1 && value.length <= 255 && ACCOUNT_ID_REGEX.test(value);

export const createAccountId = (
  value: string,
): Result<AccountId, InvalidAccountIdFormatError> => {
  const trimmed = value.trim();
  if (!isValidAccountId(trimmed)) {
    return err({ type: "InvalidAccountIdFormatError" });
  }
  return ok({ _tag: "AccountId", value: trimmed });
};
