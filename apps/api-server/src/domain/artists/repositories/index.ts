import type { Artist, ArtistPersistenceData } from "../entities";

export type ArtistUpdateAccountIdData = {
  artistId: string;
  accountId: string;
};

export interface IArtistReader {
  findByUserId(userId: string): Promise<Artist | null>;
  findByAccountId(accountId: string): Promise<Artist | null>;
}

export interface IArtistWriter {
  save(data: ArtistPersistenceData): Promise<Artist>;
  updateAccountId(data: ArtistUpdateAccountIdData): Promise<Artist>;
}
