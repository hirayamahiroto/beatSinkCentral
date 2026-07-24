import { z } from "zod";
import { type Result, ok, err } from "../../../shared/result";

export type ProfileName = {
  readonly _tag: "ProfileName";
  readonly value: string;
};

export type InvalidProfileNameFormatError = {
  readonly type: "InvalidProfileNameFormatError";
};

const schema = z
  .string()
  .trim()
  .min(1, "name is required")
  .max(255, "name must be 255 characters or less");

export const createProfileName = (
  value: string,
): Result<ProfileName, InvalidProfileNameFormatError> => {
  const result = schema.safeParse(value);
  if (!result.success) {
    return err({ type: "InvalidProfileNameFormatError" });
  }
  return ok({ _tag: "ProfileName", value: result.data });
};
