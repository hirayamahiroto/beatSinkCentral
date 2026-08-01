import type { ArtistProfileView } from "../../../domain/artistProfiles/entities";
import {
  createArtistProfileNotFoundError,
  type ArtistProfileNotFoundError,
} from "../../../domain/artistProfiles/errors/artistProfileNotFound";
import type { PublicReadCapabilities } from "../../capabilities";
import { type Result, ok, err } from "../../../utils/result";

export type GetPublicProfileInput = {
  accountId: string;
};

export type GetPublicProfileOutput = {
  accountId: string;
  profile: ArtistProfileView;
};

export type GetPublicProfileError = ArtistProfileNotFoundError;

type GetPublicProfileCaps = Pick<PublicReadCapabilities, "artistProfiles">;

export const getPublicProfile = async (
  caps: GetPublicProfileCaps,
  input: GetPublicProfileInput,
): Promise<Result<GetPublicProfileOutput, GetPublicProfileError>> => {
  const profile = await caps.artistProfiles.findPublishedByAccountId(
    input.accountId,
  );
  if (!profile) return err(createArtistProfileNotFoundError());

  return ok({
    accountId: input.accountId,
    profile: profile.toView(),
  });
};
