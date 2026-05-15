import type { Artist, ArtistState } from "../entities";
import type { AccountId } from "../valueObjects/accountId";

export const createArtistBehaviors = (state: ArtistState): Artist => ({
  getArtistId: () => state.artistId.value,
  getAccountId: () => state.accountId.value,
  getOwnerUserId: () => state.ownerUserId,
  getProfile: () => state.profile,
  hasProfile: () => state.profile !== null,
  changeAccountId: (newAccountId: AccountId) =>
    createArtistBehaviors({
      ...state,
      accountId: newAccountId,
    }),
  toPersistence: () => ({
    id: state.artistId.value,
    accountId: state.accountId.value,
    ownerUserId: state.ownerUserId,
  }),
});
