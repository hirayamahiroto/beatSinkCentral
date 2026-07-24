import { z } from "zod";
import { type Result, ok, err } from "../../../shared/result";

export type ImageUrl = {
  readonly _tag: "ImageUrl";
  readonly value: string;
};

export type InvalidImageUrlFormatError = {
  readonly type: "InvalidImageUrlFormatError";
};

const schema = z
  .string()
  .trim()
  .min(1, "imageUrl is required")
  .max(2048, "imageUrl must be 2048 characters or less")
  .url("imageUrl must be a valid URL");

export const createImageUrl = (
  value: string,
): Result<ImageUrl, InvalidImageUrlFormatError> => {
  const result = schema.safeParse(value);
  if (!result.success) {
    return err({ type: "InvalidImageUrlFormatError" });
  }
  return ok({ _tag: "ImageUrl", value: result.data });
};
