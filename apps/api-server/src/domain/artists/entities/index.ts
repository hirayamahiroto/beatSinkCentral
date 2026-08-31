import type { ArtistId } from "../valueObjects/artistId";
import type { Handle } from "../valueObjects/handle";

export type ArtistProfile = {
  readonly name: string;
};

export type ArtistState = {
  readonly artistId: ArtistId;
  readonly handle: Handle;
  readonly ownerUserId: string;
  readonly profile: ArtistProfile | null;
};

export type ArtistPersistenceData = {
  id: string;
  handle: string;
  ownerUserId: string;
};

export type Artist = {
  getArtistId: () => string;
  getHandle: () => string;
  getOwnerUserId: () => string;
  getProfile: () => ArtistProfile | null;
  hasProfile: () => boolean;
  hasHandle: (handle: Handle) => boolean;
  changeHandle: (newHandle: Handle) => Artist;
  toPersistence: () => ArtistPersistenceData;
};
