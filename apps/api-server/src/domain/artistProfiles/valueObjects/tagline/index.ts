import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";

export type Tagline = {
  readonly _tag: "Tagline";
  readonly value: string;
};

export type InvalidTaglineFormatError = Error & {
  readonly type: "InvalidTaglineFormatError";
};

export const createInvalidTaglineFormatError = (): InvalidTaglineFormatError =>
  createTypedError("InvalidTaglineFormatError");

const taglineSchema = z
  .string()
  .trim()
  .min(1, "tagline is required")
  .max(255, "tagline must be 255 characters or less");

export const createTagline = (value: string): Tagline => {
  const result = taglineSchema.safeParse(value);
  if (!result.success) {
    throw createInvalidTaglineFormatError();
  }
  return { _tag: "Tagline", value: result.data };
};
