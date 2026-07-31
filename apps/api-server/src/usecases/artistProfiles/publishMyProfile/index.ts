import {
  createArtistProfileNotFoundError,
  type ArtistProfileNotFoundError,
} from "../../../domain/artistProfiles/policies/assertArtistProfileExists";
import {
  collectMissingPublishFields,
  createProfileNotPublishableError,
  type ProfileNotPublishableError,
} from "../../../domain/artistProfiles/policies/assertProfilePublishable";
import { defineUsecase } from "../../shared/defineUsecase";
import type { WriteCapabilities } from "../../capabilities";
import { type Result, ok, err } from "../../../utils/result";

export type PublishMyProfileInput = {
  published: boolean;
};

export type PublishMyProfileOutput = {
  published: boolean;
};

export type PublishMyProfileError =
  | ArtistProfileNotFoundError
  | ProfileNotPublishableError;

type PublishMyProfileCaps = Pick<WriteCapabilities, "actor" | "artistProfiles">;

export const publishMyProfile = defineUsecase<
  PublishMyProfileCaps,
  Result<PublishMyProfileOutput, PublishMyProfileError>,
  PublishMyProfileInput
>(async (caps, input) => {
  const artistId = caps.actor.artist.getArtistId();

  const profile = await caps.artistProfiles.findByArtistId(artistId);
  if (!profile) return err(createArtistProfileNotFoundError());

  if (input.published) {
    const missingFields = collectMissingPublishFields(profile);
    if (missingFields.length > 0) {
      return err(createProfileNotPublishableError(missingFields));
    }
  }

  const saved = await caps.artistProfiles.setPublished({
    artistId,
    published: input.published,
  });

  return ok({ published: saved.isPublished() });
});
