import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";

export type ImageUrl = {
  readonly value: string;
};

export type InvalidImageUrlFormatError = Error & {
  readonly type: "InvalidImageUrlFormatError";
};

export const createInvalidImageUrlFormatError =
  (): InvalidImageUrlFormatError =>
    createTypedError("InvalidImageUrlFormatError");

// 画像は外部 URL 指定（Blob アップロードは後続フェーズ）。
const imageUrlSchema = z
  .string()
  .trim()
  .min(1, "imageUrl is required")
  .max(2048, "imageUrl must be 2048 characters or less")
  .url("imageUrl must be a valid URL");

export const createImageUrl = (value: string): ImageUrl => {
  const result = imageUrlSchema.safeParse(value);
  if (!result.success) {
    throw createInvalidImageUrlFormatError();
  }
  return { value: result.data };
};
