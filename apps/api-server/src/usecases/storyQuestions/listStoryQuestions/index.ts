import { REQUIRED_STORY_QUESTION_CODE } from "../../../domain/artistProfiles/valueObjects/storyChapter";
import type { StoryQuestionView } from "../../../domain/storyQuestions/entities";
import type { PublicReadCapabilities } from "../../capabilities";
import { type Result, ok } from "../../../utils/result";

type StoryQuestionListItem = StoryQuestionView & {
  required: boolean;
};

export type ListStoryQuestionsOutput = {
  storyQuestions: StoryQuestionListItem[];
};

type ListStoryQuestionsCaps = Pick<PublicReadCapabilities, "storyQuestions">;

export const listStoryQuestions = async (
  caps: ListStoryQuestionsCaps,
): Promise<Result<ListStoryQuestionsOutput, never>> => {
  const storyQuestions = await caps.storyQuestions.findAll();

  return ok({
    storyQuestions: storyQuestions.map((question) => ({
      ...question,
      required: question.code === REQUIRED_STORY_QUESTION_CODE,
    })),
  });
};
