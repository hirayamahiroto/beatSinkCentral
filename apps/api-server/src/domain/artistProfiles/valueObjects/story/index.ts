import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";

export type Story = {
  readonly value: string;
};

export type InvalidStoryFormatError = Error & {
  readonly type: "InvalidStoryFormatError";
};

export const createInvalidStoryFormatError = (): InvalidStoryFormatError =>
  createTypedError("InvalidStoryFormatError");

// Story はバックグラウンド本文（差別化の中核）。長文を許容する。
const storySchema = z
  .string()
  .trim()
  .min(1, "story is required")
  .max(10000, "story must be 10000 characters or less");

export const createStory = (value: string): Story => {
  const result = storySchema.safeParse(value);
  if (!result.success) {
    throw createInvalidStoryFormatError();
  }
  return { value: result.data };
};
