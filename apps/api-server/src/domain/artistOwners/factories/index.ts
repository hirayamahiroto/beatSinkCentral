import { createArtistOwnerBehaviors } from "../behaviors";
import type { ArtistOwner } from "../entities";

export type CreateArtistOwnerParams = {
  userId: string;
  artistId: string;
};

export const createArtistOwner = (
  params: CreateArtistOwnerParams
): ArtistOwner => {
  const state = {
    id: crypto.randomUUID(),
    userId: params.userId,
    artistId: params.artistId,
  };
  return createArtistOwnerBehaviors(state);
};

export type ReconstructArtistOwnerParams = {
  id: string;
  userId: string;
  artistId: string;
};

export const reconstructArtistOwner = (
  params: ReconstructArtistOwnerParams
): ArtistOwner => {
  const state = {
    id: params.id,
    userId: params.userId,
    artistId: params.artistId,
  };
  return createArtistOwnerBehaviors(state);
};
