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

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

// zod は .url() が失敗しても .refine() を実行するため、throw しない形でパースする
const hasAllowedProtocol = (value: string): boolean => {
  try {
    return ALLOWED_PROTOCOLS.has(new URL(value).protocol);
  } catch {
    return false;
  }
};

const imageUrlSchema = z
  .string()
  .trim()
  .min(1, "imageUrl is required")
  .max(2048, "imageUrl must be 2048 characters or less")
  .url("imageUrl must be a valid URL")
  .refine(hasAllowedProtocol, "imageUrl must use http or https");

export const createImageUrl = (
  value: string,
): Result<ImageUrl, InvalidImageUrlFormatError> => {
  const result = imageUrlSchema.safeParse(value);
  if (!result.success) {
    return err(createInvalidImageUrlFormatError());
  }
  return ok({ value: result.data });
};
