import type { Artist, ArtistPersistenceData } from "../entities";

export type ArtistUpdateHandleData = {
  artistId: string;
  handle: string;
};

export interface IArtistReader {
  findByUserId(userId: string): Promise<Artist | null>;
  findByHandle(handle: string): Promise<Artist | null>;
}

export interface IArtistWriter {
  save(data: ArtistPersistenceData): Promise<Artist>;
  updateHandle(data: ArtistUpdateHandleData): Promise<Artist>;
}
