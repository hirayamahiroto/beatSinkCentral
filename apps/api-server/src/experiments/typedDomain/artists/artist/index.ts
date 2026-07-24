import type { ArtistId } from "../valueObjects/artistId";
import type { AccountId } from "../valueObjects/accountId";

export type ArtistProfile = {
  readonly name: string;
};

export type Artist = {
  readonly artistId: ArtistId;
  readonly accountId: AccountId;
  readonly ownerUserId: string;
  readonly profile: ArtistProfile | null;
};
