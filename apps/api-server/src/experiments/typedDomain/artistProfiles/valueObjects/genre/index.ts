import { z } from "zod";
import { type Result, ok, err } from "../../../shared/result";

export type Genre = {
  readonly _tag: "Genre";
  readonly value: string;
};

export type InvalidGenreFormatError = {
  readonly type: "InvalidGenreFormatError";
};

const schema = z
  .string()
  .trim()
  .min(1, "genre is required")
  .max(100, "genre must be 100 characters or less");

export const createGenre = (
  value: string,
): Result<Genre, InvalidGenreFormatError> => {
  const result = schema.safeParse(value);
  if (!result.success) {
    return err({ type: "InvalidGenreFormatError" });
  }
  return ok({ _tag: "Genre", value: result.data });
};
