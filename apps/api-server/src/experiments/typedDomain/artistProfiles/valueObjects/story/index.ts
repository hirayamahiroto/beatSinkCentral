import { z } from "zod";
import { type Result, ok, err } from "../../../shared/result";

export type Story = {
  readonly _tag: "Story";
  readonly value: string;
};

export type InvalidStoryFormatError = {
  readonly type: "InvalidStoryFormatError";
};

const schema = z
  .string()
  .trim()
  .min(1, "story is required")
  .max(10000, "story must be 10000 characters or less");

export const createStory = (
  value: string,
): Result<Story, InvalidStoryFormatError> => {
  const result = schema.safeParse(value);
  if (!result.success) {
    return err({ type: "InvalidStoryFormatError" });
  }
  return ok({ _tag: "Story", value: result.data });
};
