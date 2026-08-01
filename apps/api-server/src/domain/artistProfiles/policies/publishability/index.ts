import type { ArtistProfile } from "../../entities";
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
  (error as Partial<ProfileNotPublishableError>).type ===
    "ProfileNotPublishableError";

export const collectMissingPublishFields = (
  profile: ArtistProfile,
): PublishRequiredField[] => {
  const missing: PublishRequiredField[] = [];
  if (!profile.getName()) missing.push("name");
  if (!profile.getImageUrl()) missing.push("imageUrl");
  if (!profile.getStory()) missing.push("story");
  if (profile.getGenres().length === 0) missing.push("genres");
  if (profile.getLinks().length === 0) missing.push("links");
  return missing;
};

export const ensurePublishable = (
  profile: ArtistProfile,
): Result<void, ProfileNotPublishableError> => {
  const missingFields = collectMissingPublishFields(profile);
  if (missingFields.length > 0) {
    return err(createProfileNotPublishableError(missingFields));
  }
  return ok(undefined);
};
