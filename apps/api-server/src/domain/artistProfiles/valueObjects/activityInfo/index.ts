import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

export type ActivityInfo = {
  readonly _tag: "ActivityInfo";
  readonly value: string;
};

export type InvalidActivityInfoFormatError = Error & {
  readonly type: "InvalidActivityInfoFormatError";
};

export const createInvalidActivityInfoFormatError =
  (): InvalidActivityInfoFormatError =>
    createTypedError("InvalidActivityInfoFormatError");

const activityInfoSchema = z
  .string()
  .trim()
  .min(1, "activityInfo is required")
  .max(1000, "activityInfo must be 1000 characters or less");

export const createActivityInfo = (
  value: string,
): Result<ActivityInfo, InvalidActivityInfoFormatError> => {
  const result = activityInfoSchema.safeParse(value);
  if (!result.success) {
    return err(createInvalidActivityInfoFormatError());
  }
  return ok({ _tag: "ActivityInfo", value: result.data });
};
