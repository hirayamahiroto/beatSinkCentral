import type { ArtistProfile } from "../../entities";
import { REQUIRED_STORY_QUESTION_CODE } from "../../valueObjects/storyChapter";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

export type PublishRequiredField =
  | "name"
  | "imageUrl"
  | "story"
  | "genres"
  | "links";

export type ProfileNotPublishableError = Error & {
  readonly type: "ProfileNotPublishableError";
  readonly missingFields: PublishRequiredField[];
};

export const createProfileNotPublishableError = (
  missingFields: PublishRequiredField[],
): ProfileNotPublishableError =>
  createTypedError("ProfileNotPublishableError", { missingFields });

export const isProfileNotPublishableError = (
  error: unknown,
): error is ProfileNotPublishableError =>
  error instanceof Error &&
  "type" in error &&
  error.type === "ProfileNotPublishableError";

const hasRequiredStoryChapter = (profile: ArtistProfile): boolean =>
  profile
    .getChapters()
    .some((chapter) => chapter.questionCode === REQUIRED_STORY_QUESTION_CODE);

export const collectMissingPublishFields = (
  profile: ArtistProfile,
): PublishRequiredField[] => {
  const missing: PublishRequiredField[] = [];
  if (!profile.getName()) missing.push("name");
  if (!profile.getImageUrl()) missing.push("imageUrl");
  if (!hasRequiredStoryChapter(profile)) missing.push("story");
  if (profile.getGenres().length === 0) missing.push("genres");
  if (profile.getLinks().length === 0) missing.push("links");
  return missing;
};

const isPublishable = (profile: ArtistProfile): boolean =>
  collectMissingPublishFields(profile).length === 0;

export const enforcePublishInvariant = (
  profile: ArtistProfile,
): ArtistProfile =>
  profile.isPublished() && !isPublishable(profile)
    ? profile.unpublish()
    : profile;

export const ensurePublishable = (
  profile: ArtistProfile,
): Result<void, ProfileNotPublishableError> => {
  const missingFields = collectMissingPublishFields(profile);
  if (missingFields.length > 0) {
    return err(createProfileNotPublishableError(missingFields));
  }
  return ok(undefined);
};
