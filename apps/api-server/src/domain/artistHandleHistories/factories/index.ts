import { createArtistHandleHistoryBehaviors } from "../behaviors";
import type { ArtistHandleHistory } from "../entities";

export type CreateArtistHandleHistoryParams = {
  artistId: string;
  oldHandle: string;
  newHandle: string;
  changedByUserId: string;
};

export const createArtistHandleHistory = (
  params: CreateArtistHandleHistoryParams,
): ArtistHandleHistory =>
  createArtistHandleHistoryBehaviors({
    id: crypto.randomUUID(),
    artistId: params.artistId,
    oldHandle: params.oldHandle,
    newHandle: params.newHandle,
    changedByUserId: params.changedByUserId,
  });
