import type {
  ArtistHandleHistory,
  ArtistHandleHistoryState,
} from "../entities";

export const createArtistHandleHistoryBehaviors = (
  state: ArtistHandleHistoryState,
): ArtistHandleHistory => ({
  getId: () => state.id,
  getArtistId: () => state.artistId,
  getOldHandle: () => state.oldHandle,
  getNewHandle: () => state.newHandle,
  getChangedByUserId: () => state.changedByUserId,
  toPersistence: () => ({
    id: state.id,
    artistId: state.artistId,
    oldHandle: state.oldHandle,
    newHandle: state.newHandle,
    changedByUserId: state.changedByUserId,
  }),
});
