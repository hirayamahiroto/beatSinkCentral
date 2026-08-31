import type { ArtistProfileView } from "../../../domain/artistProfiles/entities";
import {
  createArtistProfileNotFoundError,
  type ArtistProfileNotFoundError,
} from "../../../domain/artistProfiles/errors/artistProfileNotFound";
import {
  createHandle,
  type InvalidHandleFormatError,
} from "../../../domain/artists/valueObjects/handle";
import type { PublicReadCapabilities } from "../../capabilities";
import { type Result, ok, err } from "../../../utils/result";

export type GetPublicProfileInput = {
  handle: string;
};

export type GetPublicProfileOutput = {
  handle: string;
  profile: ArtistProfileView;
};

export type GetPublicProfileError =
  | InvalidHandleFormatError
  | ArtistProfileNotFoundError;

type GetPublicProfileCaps = Pick<PublicReadCapabilities, "artistProfiles">;

export const getPublicProfile = async (
  caps: GetPublicProfileCaps,
  input: GetPublicProfileInput,
): Promise<Result<GetPublicProfileOutput, GetPublicProfileError>> => {
  const parsed = createHandle(input.handle);
  if (!parsed.ok) return parsed;
  const handle = parsed.value;

  const profile = await caps.artistProfiles.findPublishedByHandle(handle.value);
  if (!profile) return err(createArtistProfileNotFoundError());

  return ok({
    handle: handle.value,
    profile: profile.toView(),
  });
};
