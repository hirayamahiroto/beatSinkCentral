import type { StoryQuestionView } from "../entities";

export interface IStoryQuestionReader {
  findAll(): Promise<StoryQuestionView[]>;
}
