import type { ArtistOwner, ArtistOwnerState } from "../entities";

export const createArtistOwnerBehaviors = (
  state: ArtistOwnerState
): ArtistOwner => ({
  getId: () => state.id,
  getUserId: () => state.userId,
  getArtistId: () => state.artistId,
  toPersistence: () => ({
    id: state.id,
    userId: state.userId,
    artistId: state.artistId,
  }),
});
