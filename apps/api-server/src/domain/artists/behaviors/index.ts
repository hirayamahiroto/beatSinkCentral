import type { Artist, ArtistState } from "../entities";

export const createArtistBehaviors = (state: ArtistState): Artist => ({
  getArtistId: () => state.artistId.value,
  getAccountId: () => state.accountId.value,
  getProfile: () => state.profile,
  hasProfile: () => state.profile !== null,
});
