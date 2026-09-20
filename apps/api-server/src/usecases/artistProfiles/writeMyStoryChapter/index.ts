import type { ArtistProfileStoryView } from "../../../domain/artistProfiles/entities";
import {
  createStoryChapter,
  createInvalidStoryChapterFormatError,
  toStoryQuestionCode,
  type InvalidStoryChapterFormatError,
  type StoryChapter,
  type StoryQuestionCode,
} from "../../../domain/artistProfiles/valueObjects/storyChapter";
import {
  clearStoryChapter,
  toView,
  writeStoryChapter as writeChapter,
} from "../../../domain/artistProfiles/behaviors";
import { edit } from "../../../domain/artistProfiles/policies/publishability";
import type { ArtistWriteCapabilities } from "../../../capabilities";
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
  const written = chapter.value;

  const state = await caps.artistProfiles.load(caps.actor.artist.getArtistId());
  const saved = await caps.artistProfiles.save(
    edit(state, (content) =>
      written === null
        ? clearStoryChapter(content, questionCode)
        : writeChapter(content, written),
    ),
  );

  return ok({ story: toView(saved).story });
};
