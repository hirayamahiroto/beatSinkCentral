import { createArtistId } from "../valueObjects/artistId";
import { createAccountId } from "../valueObjects/accountId";
import { createArtistBehaviors } from "../behaviors";
import type { Artist, ArtistProfile } from "../entities";

export type ReconstructArtistParams = {
  artistId: string;
  accountId: string;
  profile: ArtistProfile | null;
};

export const reconstructArtist = (params: ReconstructArtistParams): Artist => {
  const state = {
    artistId: createArtistId(params.artistId),
    accountId: createAccountId(params.accountId),
    profile: params.profile,
  };
  return createArtistBehaviors(state);
};
