import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

export const STORY_QUESTION_CODES = [
  "beginning",
  "turning_point",
  "concept",
] as const;

export type StoryQuestionCode = (typeof STORY_QUESTION_CODES)[number];

export const REQUIRED_STORY_QUESTION_CODE: StoryQuestionCode = "beginning";

const STORY_QUESTION_CODE_BY_VALUE = new Map<string, StoryQuestionCode>(
  STORY_QUESTION_CODES.map((code) => [code, code] as const),
);

export const toStoryQuestionCode = (
  value: string,
): StoryQuestionCode | undefined => STORY_QUESTION_CODE_BY_VALUE.get(value);

export const isStoryQuestionCode = (value: string): boolean =>
  toStoryQuestionCode(value) !== undefined;

export type StoryChapter = {
  readonly questionCode: StoryQuestionCode;
  readonly body: string;
};

export type InvalidStoryChapterFormatError = Error & {
  readonly type: "InvalidStoryChapterFormatError";
};

export const createInvalidStoryChapterFormatError =
  (): InvalidStoryChapterFormatError =>
    createTypedError("InvalidStoryChapterFormatError");

const bodySchema = z
  .string()
  .trim()
  .min(1, "story chapter body is required")
  .max(10000, "story chapter body must be 10000 characters or less");

export type StoryChapterInput = {
  questionCode: string;
  body: string;
};

export const createStoryChapter = (
  input: StoryChapterInput,
): Result<StoryChapter, InvalidStoryChapterFormatError> => {
  const questionCode = toStoryQuestionCode(input.questionCode);
  if (questionCode === undefined) {
    return err(createInvalidStoryChapterFormatError());
  }

  const body = bodySchema.safeParse(input.body);
  if (!body.success) {
    return err(createInvalidStoryChapterFormatError());
  }

  return ok({ questionCode, body: body.data });
};
