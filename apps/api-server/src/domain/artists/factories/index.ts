import {
  createArtistId,
  type InvalidArtistIdFormatError,
} from "../valueObjects/artistId";
import {
  createAccountId,
  type InvalidAccountIdFormatError,
} from "../valueObjects/accountId";
import { createArtistBehaviors } from "../behaviors";
import type { Artist, ArtistProfile, ArtistState } from "../entities";
import { type Result, map, all, unwrapOrThrow } from "../../../utils/result";

export type ArtistFieldError =
  | InvalidArtistIdFormatError
  | InvalidAccountIdFormatError;

type ArtistFields = {
  artistId: string;
  accountId: string;
  ownerUserId: string;
  profile: ArtistProfile | null;
};

const buildState = (
  fields: ArtistFields,
): Result<ArtistState, ArtistFieldError> =>
  map(
    all({
      artistId: createArtistId(fields.artistId),
      accountId: createAccountId(fields.accountId),
    }),
    (values) => ({
      ...values,
      ownerUserId: fields.ownerUserId,
      profile: fields.profile,
    }),
  );

export type CreateArtistParams = {
  accountId: string;
  ownerUserId: string;
};

export const createArtist = (
  params: CreateArtistParams,
): Result<Artist, ArtistFieldError> =>
  map(
    buildState({
      artistId: crypto.randomUUID(),
      accountId: params.accountId,
      ownerUserId: params.ownerUserId,
      profile: null,
    }),
    createArtistBehaviors,
  );

export type ReconstructArtistParams = ArtistFields;

export const reconstructArtist = (params: ReconstructArtistParams): Artist =>
  unwrapOrThrow(
    map(buildState(params), createArtistBehaviors),
    "reconstructArtist: stored artist has invalid field values",
  );
