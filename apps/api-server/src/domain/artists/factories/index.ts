import {
  createArtistId,
  type InvalidArtistIdFormatError,
} from "../valueObjects/artistId";
import {
  createHandle,
  type InvalidHandleFormatError,
} from "../valueObjects/handle";
import { createArtistBehaviors } from "../behaviors";
import type { Artist, ArtistProfile, ArtistState } from "../entities";
import { type Result, map, all, unwrapOrThrow } from "../../../utils/result";

export type ArtistFieldError =
  | InvalidArtistIdFormatError
  | InvalidHandleFormatError;

type ArtistFields = {
  artistId: string;
  handle: string;
  ownerUserId: string;
  profile: ArtistProfile | null;
};

const buildState = (
  fields: ArtistFields,
): Result<ArtistState, ArtistFieldError> =>
  map(
    all({
      artistId: createArtistId(fields.artistId),
      handle: createHandle(fields.handle),
    }),
    (values) => ({
      ...values,
      ownerUserId: fields.ownerUserId,
      profile: fields.profile,
    }),
  );

export type CreateArtistParams = {
  handle: string;
  ownerUserId: string;
};

export const createArtist = (
  params: CreateArtistParams,
): Result<Artist, ArtistFieldError> =>
  map(
    buildState({
      artistId: crypto.randomUUID(),
      handle: params.handle,
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
