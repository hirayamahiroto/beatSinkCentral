import {
  createArtistProfileNotFoundError,
  type ArtistProfileNotFoundError,
} from "../../../domain/artistProfiles/errors/artistProfileNotFound";
import {
  publish,
  type ProfileNotPublishableError,
} from "../../../domain/artistProfiles/policies/publishability";
import { unpublish } from "../../../domain/artistProfiles/behaviors";
import type { ArtistWriteCapabilities } from "../../../capabilities";
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

type PublishMyProfileCaps = Pick<
  ArtistWriteCapabilities,
  "actor" | "artistProfiles"
>;

export const publishMyProfile = async (
  caps: PublishMyProfileCaps,
  input: PublishMyProfileInput,
): Promise<Result<PublishMyProfileOutput, PublishMyProfileError>> => {
  const state = await caps.artistProfiles.load(caps.actor.artist.getArtistId());

  switch (state.kind) {
    case "noProfile":
      return err(createArtistProfileNotFoundError());

    case "draft": {
      if (!input.published) return ok({ published: false });
      const published = publish(state);
      if (!published.ok) return published;
      await caps.artistProfiles.publish(published.value);
      return ok({ published: true });
    }

    case "published": {
      if (input.published) return ok({ published: true });
      await caps.artistProfiles.save(unpublish(state));
      return ok({ published: false });
    }
  }
};
