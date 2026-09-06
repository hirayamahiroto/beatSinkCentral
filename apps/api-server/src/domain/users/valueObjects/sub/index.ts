import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

export type Sub = {
  readonly value: string;
};

export type InvalidSubFormatError = Error & {
  readonly type: "InvalidSubFormatError";
};

const createInvalidSubFormatError = (): InvalidSubFormatError =>
  createTypedError("InvalidSubFormatError");

const isValidSub = (sub: string): boolean => {
  return sub.trim().length > 0;
};

export const createSub = (
  value: string,
): Result<Sub, InvalidSubFormatError> => {
  if (!value || !isValidSub(value)) {
    return err(createInvalidSubFormatError());
  }
  return ok({ value });
};
