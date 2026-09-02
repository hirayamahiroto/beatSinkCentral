import type { ArtistProfileView } from "../../../domain/artistProfiles/entities";
import {
  collectMissingPublishFields,
  type PublishRequiredField,
} from "../../../domain/artistProfiles/policies/publishability";
import { REQUIRED_STORY_QUESTION_CODE } from "../../../domain/artistProfiles/valueObjects/storyChapter";
import type { StoryQuestionView } from "../../../domain/storyQuestions/entities";
import type { ArtistReadCapabilities } from "../../capabilities";
import { type Result, ok } from "../../../utils/result";

export type EditableStoryQuestion = StoryQuestionView & {
  required: boolean;
};

export type GetMyProfileOutput = {
  handle: string;
  profile: ArtistProfileView | null;
  missingPublishFields: PublishRequiredField[] | null;
  storyQuestions: EditableStoryQuestion[];
};

type GetMyProfileCaps = Pick<
  ArtistReadCapabilities,
  "actor" | "artistProfiles" | "storyQuestions"
>;

const toEditableStoryQuestions = (
  storyQuestions: StoryQuestionView[],
): EditableStoryQuestion[] =>
  storyQuestions.map((question) => ({
    ...question,
    required: question.code === REQUIRED_STORY_QUESTION_CODE,
  }));

export const getMyProfile = async (
  caps: GetMyProfileCaps,
): Promise<Result<GetMyProfileOutput, never>> => {
  const [profile, storyQuestions] = await Promise.all([
    caps.artistProfiles.findByArtistId(caps.actor.artist.getArtistId()),
    caps.storyQuestions.findAll(),
  ]);

  return ok({
    handle: caps.actor.artist.getHandle(),
    profile: profile ? profile.toView() : null,
    missingPublishFields: profile ? collectMissingPublishFields(profile) : null,
    storyQuestions: toEditableStoryQuestions(storyQuestions),
  });
};
