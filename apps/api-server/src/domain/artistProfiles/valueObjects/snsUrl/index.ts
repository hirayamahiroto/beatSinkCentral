import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";

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

export const createSnsUrl = (value: string): SnsUrl => {
  const result = snsUrlSchema.safeParse(value);
  if (!result.success) {
    throw createInvalidSnsUrlFormatError();
  }
  return { _tag: "SnsUrl", value: result.data };
};
