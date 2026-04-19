import { createTypedError } from "../../../../utils/errors/createTypedError";

export type Sub = {
  readonly value: string;
};

export type InvalidSubFormatError = Error & {
  readonly type: "InvalidSubFormatError";
};

export const createInvalidSubFormatError = (): InvalidSubFormatError =>
  createTypedError("InvalidSubFormatError");

const isValidSub = (sub: string): boolean => {
  return sub.trim().length > 0;
};

export const createSub = (value: string): Sub => {
  if (!value || !isValidSub(value)) {
    throw createInvalidSubFormatError();
  }
  return { value };
};
