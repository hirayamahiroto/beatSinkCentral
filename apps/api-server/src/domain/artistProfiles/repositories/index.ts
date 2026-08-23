import type { ArtistProfile, ArtistProfilePersistenceData } from "../entities";
import type { ProfileImage } from "../valueObjects/profileImage";
import type { ProfileImageUploadFailedError } from "../errors/profileImageUploadFailed";
import type { Result } from "../../../utils/result";
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

export type ProfileImageUploadData = {
  artistId: string;
  image: ProfileImage;
  bytes: Promise<Uint8Array>;
};

export interface IProfileImageStorage {
  upload(
    data: ProfileImageUploadData,
  ): Promise<Result<{ publicUrl: string }, ProfileImageUploadFailedError>>;
}
