import { asc } from "drizzle-orm";
import { storyQuestionsTable } from "../../../../../../packages/database/src/utils/createClient";
import type { IStoryQuestionReader } from "../../../domain/storyQuestions/repositories";
import type { StoryQuestionView } from "../../../domain/storyQuestions/entities";
import type { Executor } from "../../transaction";

export const createStoryQuestionReader = (
  executor: Executor,
): IStoryQuestionReader => ({
  async findAll(): Promise<StoryQuestionView[]> {
    return executor
      .select({
        code: storyQuestionsTable.code,
        label: storyQuestionsTable.label,
      })
      .from(storyQuestionsTable)
      .orderBy(asc(storyQuestionsTable.sortOrder));
  },
});
