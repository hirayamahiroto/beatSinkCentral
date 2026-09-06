export type ArtistHandleHistoryState = {
  readonly id: string;
  readonly artistId: string;
  readonly oldHandle: string;
  readonly newHandle: string;
  readonly changedByUserId: string;
};

export type ArtistHandleHistoryPersistenceData = {
  id: string;
  artistId: string;
  oldHandle: string;
  newHandle: string;
  changedByUserId: string;
};

export type ArtistHandleHistory = {
  toPersistence: () => ArtistHandleHistoryPersistenceData;
};
