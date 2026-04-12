import type { ArtistId } from "../valueObjects/artistId";
import type { AccountId } from "../valueObjects/accountId";

export type ArtistProfile = {
  readonly name: string;
};

export type ArtistState = {
  readonly artistId: ArtistId;
  readonly accountId: AccountId;
  readonly profile: ArtistProfile | null;
};

export type Artist = {
  getArtistId: () => string;
  getAccountId: () => string;
  getProfile: () => ArtistProfile | null;
  hasProfile: () => boolean;
};
