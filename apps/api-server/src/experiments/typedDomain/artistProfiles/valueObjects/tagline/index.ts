import { z } from "zod";
import { type Result, ok, err } from "../../../shared/result";

export type Tagline = {
  readonly _tag: "Tagline";
  readonly value: string;
};

export type InvalidTaglineFormatError = {
  readonly type: "InvalidTaglineFormatError";
};

const schema = z
  .string()
  .trim()
  .min(1, "tagline is required")
  .max(255, "tagline must be 255 characters or less");

export const createTagline = (
  value: string,
): Result<Tagline, InvalidTaglineFormatError> => {
  const result = schema.safeParse(value);
  if (!result.success) {
    return err({ type: "InvalidTaglineFormatError" });
  }
  return ok({ _tag: "Tagline", value: result.data });
};
