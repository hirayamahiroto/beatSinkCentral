import type {
  ArtistHandleHistory,
  ArtistHandleHistoryState,
} from "../entities";

export const createArtistHandleHistoryBehaviors = (
  state: ArtistHandleHistoryState,
): ArtistHandleHistory => ({
  toPersistence: () => ({
    id: state.id,
    artistId: state.artistId,
    oldHandle: state.oldHandle,
    newHandle: state.newHandle,
    changedByUserId: state.changedByUserId,
  }),
});
