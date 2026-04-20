import { createTypedError } from "../../../../utils/errors/createTypedError";

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

export const createEmail = (value: string): Email => {
  if (!isValidEmail(value)) {
    throw createInvalidEmailFormatError();
  }
  return { value };
};
