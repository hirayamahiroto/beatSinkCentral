import { createTypedError } from "../../../../utils/errors/createTypedError";
import { ok, err, type Result } from "../../../../utils/result";

export interface Name {
  readonly _tag: "Name";
  readonly value: string;
}

export type InvalidNameFormatError = Error & {
  readonly type: "InvalidNameFormatError";
};

export const createInvalidNameFormatError = (): InvalidNameFormatError =>
  createTypedError("InvalidNameFormatError");

const maxLength = 255;

const isValidName = (name: string): boolean => {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength;
};

export const createName = (
  value: string,
): Result<Name, InvalidNameFormatError> => {
  if (!isValidName(value)) {
    return err(createInvalidNameFormatError());
  }
  return ok({ _tag: "Name", value });
};
