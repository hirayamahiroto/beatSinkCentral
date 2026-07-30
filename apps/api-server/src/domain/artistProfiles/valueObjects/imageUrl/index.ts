import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

export type ImageUrl = {
  readonly value: string;
};

export type InvalidImageUrlFormatError = Error & {
  readonly type: "InvalidImageUrlFormatError";
};

export const createInvalidImageUrlFormatError =
  (): InvalidImageUrlFormatError =>
    createTypedError("InvalidImageUrlFormatError");

const imageUrlSchema = z
  .string()
  .trim()
  .min(1, "imageUrl is required")
  .max(2048, "imageUrl must be 2048 characters or less")
  .url("imageUrl must be a valid URL");

export const createImageUrl = (
  value: string,
): Result<ImageUrl, InvalidImageUrlFormatError> => {
  const result = imageUrlSchema.safeParse(value);
  if (!result.success) {
    return err(createInvalidImageUrlFormatError());
  }
  return ok({ value: result.data });
};
