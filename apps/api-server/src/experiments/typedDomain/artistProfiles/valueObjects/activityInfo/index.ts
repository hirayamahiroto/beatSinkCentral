import { z } from "zod";
import { type Result, ok, err } from "../../../shared/result";

export type ActivityInfo = {
  readonly _tag: "ActivityInfo";
  readonly value: string;
};

export type InvalidActivityInfoFormatError = {
  readonly type: "InvalidActivityInfoFormatError";
};

const schema = z
  .string()
  .trim()
  .min(1, "activityInfo is required")
  .max(1000, "activityInfo must be 1000 characters or less");

export const createActivityInfo = (
  value: string,
): Result<ActivityInfo, InvalidActivityInfoFormatError> => {
  const result = schema.safeParse(value);
  if (!result.success) {
    return err({ type: "InvalidActivityInfoFormatError" });
  }
  return ok({ _tag: "ActivityInfo", value: result.data });
};
