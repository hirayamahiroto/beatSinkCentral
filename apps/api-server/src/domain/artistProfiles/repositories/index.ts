import type { ArtistProfile, ArtistProfilePersistenceData } from "../entities";
export type ArtistProfileSaveData = ArtistProfilePersistenceData;

export type ArtistProfileSetPublishedData = {
  artistId: string;
  published: boolean;
};

export interface IArtistProfileReader {
  findByArtistId(artistId: string): Promise<ArtistProfile | null>;
  findPublishedByAccountId(accountId: string): Promise<ArtistProfile | null>;
}

export interface IArtistProfileWriter {
  upsert(data: ArtistProfileSaveData): Promise<ArtistProfile>;
  setPublished(data: ArtistProfileSetPublishedData): Promise<ArtistProfile>;
}
