import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";

export type Genre = {
  readonly value: string;
};

export type InvalidGenreFormatError = Error & {
  readonly type: "InvalidGenreFormatError";
};

export const createInvalidGenreFormatError = (): InvalidGenreFormatError =>
  createTypedError("InvalidGenreFormatError");

// ジャンル / スタイルは当面は自由入力（マスタ化は後続）。
const genreSchema = z
  .string()
  .trim()
  .min(1, "genre is required")
  .max(100, "genre must be 100 characters or less");

export const createGenre = (value: string): Genre => {
  const result = genreSchema.safeParse(value);
  if (!result.success) {
    throw createInvalidGenreFormatError();
  }
  return { value: result.data };
};
