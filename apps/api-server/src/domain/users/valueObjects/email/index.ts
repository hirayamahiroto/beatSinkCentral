import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

export type Email = {
  readonly value: string;
};

export type InvalidEmailFormatError = Error & {
  readonly type: "InvalidEmailFormatError";
};

export const createInvalidEmailFormatError = (): InvalidEmailFormatError =>
  createTypedError("InvalidEmailFormatError");

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const createEmail = (
  value: string,
): Result<Email, InvalidEmailFormatError> => {
  if (!isValidEmail(value)) {
    return err(createInvalidEmailFormatError());
  }
  return ok({ value });
};
