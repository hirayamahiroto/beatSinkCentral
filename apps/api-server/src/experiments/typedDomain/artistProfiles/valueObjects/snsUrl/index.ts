import { z } from "zod";
import { type Result, ok, err } from "../../../shared/result";

export type SnsUrl = {
  readonly _tag: "SnsUrl";
  readonly value: string;
};

export type InvalidSnsUrlFormatError = {
  readonly type: "InvalidSnsUrlFormatError";
};

const schema = z
  .string()
  .trim()
  .min(1, "snsUrl is required")
  .max(2048, "snsUrl must be 2048 characters or less")
  .url("snsUrl must be a valid URL");

export const createSnsUrl = (
  value: string,
): Result<SnsUrl, InvalidSnsUrlFormatError> => {
  const result = schema.safeParse(value);
  if (!result.success) {
    return err({ type: "InvalidSnsUrlFormatError" });
  }
  return ok({ _tag: "SnsUrl", value: result.data });
};
