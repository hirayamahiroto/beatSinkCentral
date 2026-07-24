import { type Result, ok, err } from "../../result";

export type Email = {
  readonly _tag: "Email";
  readonly value: string;
};

export type InvalidEmailFormatError = {
  readonly type: "InvalidEmailFormatError";
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (value: string): boolean =>
  EMAIL_REGEX.test(value) && value.length <= 254;

export const createEmail = (
  value: string,
): Result<Email, InvalidEmailFormatError> => {
  const trimmed = value.trim();
  if (!isValidEmail(trimmed)) {
    return err({ type: "InvalidEmailFormatError" });
  }
  return ok({ _tag: "Email", value: trimmed });
};
