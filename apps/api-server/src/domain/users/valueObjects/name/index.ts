import { createTypedError } from "../../../../utils/errors/createTypedError";

export interface Name {
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

export const createName = (value: string): Name => {
  if (!isValidName(value)) {
    throw createInvalidNameFormatError();
  }
  return { value };
};
