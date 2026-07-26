import {
  createArtistId,
  type InvalidArtistIdFormatError,
} from "../valueObjects/artistId";
import {
  createAccountId,
  type InvalidAccountIdFormatError,
} from "../valueObjects/accountId";
import { createArtistBehaviors } from "../behaviors";
import type { Artist, ArtistProfile } from "../entities";
import {
  type Result,
  flatMap,
  map,
  unwrapOrThrow,
} from "../../../utils/result";

export type CreateArtistParams = {
  accountId: string;
  ownerUserId: string;
};

export type CreateArtistError =
  | InvalidArtistIdFormatError
  | InvalidAccountIdFormatError;

export const createArtist = (
  params: CreateArtistParams,
): Result<Artist, CreateArtistError> =>
  flatMap(createArtistId(crypto.randomUUID()), (artistId) =>
    map(createAccountId(params.accountId), (accountId) =>
      createArtistBehaviors({
        artistId,
        accountId,
        ownerUserId: params.ownerUserId,
        profile: null,
      }),
    ),
  );

export type ReconstructArtistParams = {
  artistId: string;
  accountId: string;
  ownerUserId: string;
  profile: ArtistProfile | null;
};

export const reconstructArtist = (params: ReconstructArtistParams): Artist => {
  const artistId = unwrapOrThrow(
    createArtistId(params.artistId),
    "reconstructArtist: invalid artistId in stored data",
  );
  const accountId = unwrapOrThrow(
    createAccountId(params.accountId),
    "reconstructArtist: invalid accountId in stored data",
  );

  return createArtistBehaviors({
    artistId,
    accountId,
    ownerUserId: params.ownerUserId,
    profile: params.profile,
  });
};
