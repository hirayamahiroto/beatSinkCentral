import type { ArtistId } from "../valueObjects/artistId";
import type { AccountId } from "../valueObjects/accountId";

export type ArtistProfile = {
  readonly name: string;
};

export type ArtistState = {
  readonly artistId: ArtistId;
  readonly accountId: AccountId;
  readonly ownerUserId: string;
  readonly profile: ArtistProfile | null;
};

export type ArtistPersistenceData = {
  id: string;
  accountId: string;
  ownerUserId: string;
};

export type Artist = {
  getArtistId: () => string;
  getAccountId: () => string;
  getOwnerUserId: () => string;
  getProfile: () => ArtistProfile | null;
  hasProfile: () => boolean;
  changeAccountId: (newAccountId: AccountId) => Artist;
  toPersistence: () => ArtistPersistenceData;
};
