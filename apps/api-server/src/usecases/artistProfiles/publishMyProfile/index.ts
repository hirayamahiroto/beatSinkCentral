import {
  createArtistProfileNotFoundError,
  type ArtistProfileNotFoundError,
} from "../../../domain/artistProfiles/errors/artistProfileNotFound";
import {
  ensurePublishable,
  type ProfileNotPublishableError,
} from "../../../domain/artistProfiles/policies/publishability";
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

export const publishMyProfile = async (
  caps: PublishMyProfileCaps,
  input: PublishMyProfileInput,
): Promise<Result<PublishMyProfileOutput, PublishMyProfileError>> => {
  const artistId = caps.actor.artist.getArtistId();

  const profile = await caps.artistProfiles.findByArtistId(artistId);
  if (!profile) return err(createArtistProfileNotFoundError());

  if (input.published) {
    const publishable = ensurePublishable(profile);
    if (!publishable.ok) return publishable;
  }

  const saved = await caps.artistProfiles.setPublished({
    artistId,
    published: input.published,
  });

  return ok({ published: saved.isPublished() });
};
