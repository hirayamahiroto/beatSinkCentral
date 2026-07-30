import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

export type SnsUrl = {
  readonly _tag: "SnsUrl";
  readonly value: string;
};

export type InvalidSnsUrlFormatError = Error & {
  readonly type: "InvalidSnsUrlFormatError";
};

export const createInvalidSnsUrlFormatError = (): InvalidSnsUrlFormatError =>
  createTypedError("InvalidSnsUrlFormatError");

const snsUrlSchema = z
  .string()
  .trim()
  .min(1, "snsUrl is required")
  .max(2048, "snsUrl must be 2048 characters or less")
  .url("snsUrl must be a valid URL");

export const createSnsUrl = (
  value: string,
): Result<SnsUrl, InvalidSnsUrlFormatError> => {
  const result = snsUrlSchema.safeParse(value);
  if (!result.success) {
    return err(createInvalidSnsUrlFormatError());
  }
  return ok({ _tag: "SnsUrl", value: result.data });
};
