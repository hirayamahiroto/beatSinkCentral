import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

export type Genre = {
  readonly value: string;
};

export type InvalidGenreFormatError = Error & {
  readonly type: "InvalidGenreFormatError";
};

const createInvalidGenreFormatError = (): InvalidGenreFormatError =>
  createTypedError("InvalidGenreFormatError");

const genreSchema = z
  .string()
  .trim()
  .min(1, "genre is required")
  .max(100, "genre must be 100 characters or less");

export const createGenre = (
  value: string,
): Result<Genre, InvalidGenreFormatError> => {
  const result = genreSchema.safeParse(value);
  if (!result.success) {
    return err(createInvalidGenreFormatError());
  }
  return ok({ value: result.data });
};
