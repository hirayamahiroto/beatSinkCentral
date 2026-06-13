import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";

export type ActivityInfo = {
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

export const createActivityInfo = (value: string): ActivityInfo => {
  const result = activityInfoSchema.safeParse(value);
  if (!result.success) {
    throw createInvalidActivityInfoFormatError();
  }
  return { value: result.data };
};
