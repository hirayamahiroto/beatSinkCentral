import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";

export type Story = {
  readonly _tag: "Story";
  readonly value: string;
};

export type InvalidStoryFormatError = Error & {
  readonly type: "InvalidStoryFormatError";
};

export const createInvalidStoryFormatError = (): InvalidStoryFormatError =>
  createTypedError("InvalidStoryFormatError");

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
  return { _tag: "Story", value: result.data };
};
