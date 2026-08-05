import type { ArtistProfile, ArtistProfilePersistenceData } from "../entities";
export type ArtistProfileSaveData = ArtistProfilePersistenceData;

export type ArtistProfileSetPublishedData = {
  artistId: string;
  published: boolean;
};

export type PublishedProfileSummary = {
  accountId: string;
  name: string;
  imageUrl: string | null;
};

export type ListPublishedSummariesInput = {
  limit: number;
};

export interface IArtistProfileReader {
  findByArtistId(artistId: string): Promise<ArtistProfile | null>;
  findPublishedByAccountId(accountId: string): Promise<ArtistProfile | null>;
  listPublishedSummaries(
    input: ListPublishedSummariesInput,
  ): Promise<PublishedProfileSummary[]>;
}

export interface IArtistProfileWriter {
  upsert(data: ArtistProfileSaveData): Promise<ArtistProfile>;
  setPublished(data: ArtistProfileSetPublishedData): Promise<ArtistProfile>;
}
