import type { Artist, ArtistState } from "../entities";
import type { Handle } from "../valueObjects/handle";

export const createArtistBehaviors = (state: ArtistState): Artist => ({
  getArtistId: () => state.artistId.value,
  getHandle: () => state.handle.value,
  hasProfile: () => state.profile !== null,
  hasHandle: (handle: Handle) => state.handle.value === handle.value,
  changeHandle: (newHandle: Handle) =>
    createArtistBehaviors({
      ...state,
      handle: newHandle,
    }),
  toPersistence: () => ({
    id: state.artistId.value,
    handle: state.handle.value,
    ownerUserId: state.ownerUserId,
  }),
});
