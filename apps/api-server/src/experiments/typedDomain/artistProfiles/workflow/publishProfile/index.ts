import { type Result, ok, err } from "../../../shared/result";
import {
  type DraftProfile,
  type PublishedProfile,
  isNonEmpty,
} from "../../profile";

export type ProfileNotPublishableError = {
  readonly type: "ProfileNotPublishableError";
  readonly missingFields: readonly string[];
};

export const publishProfile = (
  draft: DraftProfile,
): Result<PublishedProfile, ProfileNotPublishableError> => {
  const { name, tagline, imageUrl, story, activityInfo, genres, links } = draft;

  const missingFields: string[] = [];
  if (!name) missingFields.push("name");
  if (!imageUrl) missingFields.push("imageUrl");
  if (!story) missingFields.push("story");
  if (!isNonEmpty(genres)) missingFields.push("genres");
  if (!isNonEmpty(links)) missingFields.push("links");

  if (
    !name ||
    !imageUrl ||
    !story ||
    !isNonEmpty(genres) ||
    !isNonEmpty(links)
  ) {
    return err({ type: "ProfileNotPublishableError", missingFields });
  }

  return ok({
    status: "published",
    id: draft.id,
    artistId: draft.artistId,
    name,
    tagline,
    imageUrl,
    story,
    activityInfo,
    genres,
    links,
  });
};
