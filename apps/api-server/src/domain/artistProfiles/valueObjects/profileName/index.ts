import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

export type ProfileName = {
  readonly _tag: "ProfileName";
  readonly value: string;
};

export type InvalidProfileNameFormatError = Error & {
  readonly type: "InvalidProfileNameFormatError";
};

export const createInvalidProfileNameFormatError =
  (): InvalidProfileNameFormatError =>
    createTypedError("InvalidProfileNameFormatError");

const profileNameSchema = z
  .string()
  .trim()
  .min(1, "name is required")
  .max(255, "name must be 255 characters or less");

export const createProfileName = (
  value: string,
): Result<ProfileName, InvalidProfileNameFormatError> => {
  const result = profileNameSchema.safeParse(value);
  if (!result.success) {
    return err(createInvalidProfileNameFormatError());
  }
  return ok({ _tag: "ProfileName", value: result.data });
};
