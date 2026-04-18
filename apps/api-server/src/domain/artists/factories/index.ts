import { createArtistId } from "../valueObjects/artistId";
import { createAccountId } from "../valueObjects/accountId";
import { createArtistBehaviors } from "../behaviors";
import type { Artist, ArtistProfile } from "../entities";

export type CreateArtistParams = {
  accountId: string;
  ownerUserId: string;
};

export const createArtist = (params: CreateArtistParams): Artist => {
  const state = {
    artistId: createArtistId(crypto.randomUUID()),
    accountId: createAccountId(params.accountId),
    ownerUserId: params.ownerUserId,
    profile: null,
  };
  return createArtistBehaviors(state);
};

export type ReconstructArtistParams = {
  artistId: string;
  accountId: string;
  ownerUserId: string;
  profile: ArtistProfile | null;
};

export const reconstructArtist = (params: ReconstructArtistParams): Artist => {
  const state = {
    artistId: createArtistId(params.artistId),
    accountId: createAccountId(params.accountId),
    ownerUserId: params.ownerUserId,
    profile: params.profile,
  };
  return createArtistBehaviors(state);
};
