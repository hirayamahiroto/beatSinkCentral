import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

export type Story = {
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

export const createStory = (
  value: string,
): Result<Story, InvalidStoryFormatError> => {
  const result = storySchema.safeParse(value);
  if (!result.success) {
    return err(createInvalidStoryFormatError());
  }
  return ok({ value: result.data });
};
