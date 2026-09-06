import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

export type Tagline = {
  readonly value: string;
};

export type InvalidTaglineFormatError = Error & {
  readonly type: "InvalidTaglineFormatError";
};

const createInvalidTaglineFormatError = (): InvalidTaglineFormatError =>
  createTypedError("InvalidTaglineFormatError");

const taglineSchema = z
  .string()
  .trim()
  .min(1, "tagline is required")
  .max(255, "tagline must be 255 characters or less");

export const createTagline = (
  value: string,
): Result<Tagline, InvalidTaglineFormatError> => {
  const result = taglineSchema.safeParse(value);
  if (!result.success) {
    return err(createInvalidTaglineFormatError());
  }
  return ok({ value: result.data });
};
