export type ArtistOwnerState = {
  readonly id: string;
  readonly userId: string;
  readonly artistId: string;
};

export type ArtistOwnerPersistenceData = {
  id: string;
  userId: string;
  artistId: string;
};

export type ArtistOwner = {
  getId: () => string;
  getUserId: () => string;
  getArtistId: () => string;
  toPersistence: () => ArtistOwnerPersistenceData;
};
