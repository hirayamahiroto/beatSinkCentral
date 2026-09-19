import type { ArtistProfileStoryView } from "../../../domain/artistProfiles/entities";
import {
  createStoryChapter,
  createInvalidStoryChapterFormatError,
  toStoryQuestionCode,
  type InvalidStoryChapterFormatError,
  type StoryChapter,
  type StoryQuestionCode,
} from "../../../domain/artistProfiles/valueObjects/storyChapter";
import type { ArtistWriteCapabilities } from "../../capabilities";
import { loadOrDraftMyProfile } from "../loadOrDraftMyProfile";
import { persistMyProfile } from "../persistMyProfile";
import { type Result, ok, err } from "../../../utils/result";

export type WriteMyStoryChapterInput = {
  chapterKey: string;
  body: string;
};

export type WriteMyStoryChapterOutput = {
  story: ArtistProfileStoryView;
};

export type WriteMyStoryChapterError = InvalidStoryChapterFormatError;

type WriteMyStoryChapterCaps = Pick<
  ArtistWriteCapabilities,
  "actor" | "artistProfiles"
>;

const toChapterOrClear = (
  questionCode: StoryQuestionCode,
  body: string,
): Result<StoryChapter | null, InvalidStoryChapterFormatError> =>
  body.trim().length === 0
    ? ok(null)
    : createStoryChapter({ questionCode, body });

export const writeMyStoryChapter = async (
  caps: WriteMyStoryChapterCaps,
  input: WriteMyStoryChapterInput,
): Promise<Result<WriteMyStoryChapterOutput, WriteMyStoryChapterError>> => {
  const questionCode = toStoryQuestionCode(input.chapterKey);
  if (questionCode === undefined) {
    return err(createInvalidStoryChapterFormatError());
  }

  const chapter = toChapterOrClear(questionCode, input.body);
  if (!chapter.ok) return chapter;

  const profile = await loadOrDraftMyProfile(caps);
  const revised =
    chapter.value === null
      ? profile.clearStoryChapter(questionCode)
      : profile.writeStoryChapter(chapter.value);
  const saved = await persistMyProfile(caps, revised);

  return ok({ story: saved.toView().story });
};
