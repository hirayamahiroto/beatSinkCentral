import { type Result, ok, err } from "../../result";

export type Sub = {
  readonly _tag: "Sub";
  readonly value: string;
};

export type InvalidSubFormatError = {
  readonly type: "InvalidSubFormatError";
};

const isValidSub = (value: string): boolean => value.trim().length > 0;

export const createSub = (
  value: string,
): Result<Sub, InvalidSubFormatError> => {
  const trimmed = value.trim();
  if (!isValidSub(trimmed)) {
    return err({ type: "InvalidSubFormatError" });
  }
  return ok({ _tag: "Sub", value: trimmed });
};
