import type { ArtistProfile } from "../../entities";
import { createTypedError } from "../../../../utils/errors/createTypedError";

export type ProfileNotPublishableError = Error & {
  readonly type: "ProfileNotPublishableError";
  readonly missingFields: string[];
};

export const createProfileNotPublishableError = (
  missingFields: string[],
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
): string[] => {
  const missing: string[] = [];
  if (!profile.name) missing.push("name");
  if (!profile.imageUrl) missing.push("imageUrl");
  if (!profile.story) missing.push("story");
  if (profile.genres.length === 0) missing.push("genres");
  if (profile.links.length === 0) missing.push("links");
  return missing;
};

export const assertProfilePublishable = (profile: ArtistProfile): void => {
  const missing = collectMissingPublishFields(profile);
  if (missing.length > 0) {
    throw createProfileNotPublishableError(missing);
  }
};
