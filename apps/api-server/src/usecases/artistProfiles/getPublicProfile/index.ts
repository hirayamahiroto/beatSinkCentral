import type { ArtistProfileView } from "../../../domain/artistProfiles/entities";
import {
  createArtistProfileNotFoundError,
  type ArtistProfileNotFoundError,
} from "../../../domain/artistProfiles/errors/artistProfileNotFound";
import {
  createAccountId,
  type InvalidAccountIdFormatError,
} from "../../../domain/artists/valueObjects/accountId";
import type { PublicReadCapabilities } from "../../capabilities";
import { type Result, ok, err } from "../../../utils/result";

export type GetPublicProfileInput = {
  accountId: string;
};

export type GetPublicProfileOutput = {
  accountId: string;
  profile: ArtistProfileView;
};

export type GetPublicProfileError =
  | InvalidAccountIdFormatError
  | ArtistProfileNotFoundError;

type GetPublicProfileCaps = Pick<PublicReadCapabilities, "artistProfiles">;

export const getPublicProfile = async (
  caps: GetPublicProfileCaps,
  input: GetPublicProfileInput,
): Promise<Result<GetPublicProfileOutput, GetPublicProfileError>> => {
  const parsed = createAccountId(input.accountId);
  if (!parsed.ok) return parsed;
  const accountId = parsed.value;

  const profile = await caps.artistProfiles.findPublishedByAccountId(
    accountId.value,
  );
  if (!profile) return err(createArtistProfileNotFoundError());

  return ok({
    accountId: accountId.value,
    profile: profile.toView(),
  });
};
