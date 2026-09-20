import type {
  ProfileState,
  PublishedProfile,
  StoredProfile,
} from "../entities";
import type { ProfileImage } from "../valueObjects/profileImage";
import type { ProfileImageUploadFailedError } from "../errors/profileImageUploadFailed";
import type { Result } from "../../../utils/result";

export type PublishedProfileSummary = {
  handle: string;
  name: string;
  imageUrl: string | null;
  tagline: string | null;
  genres: string[];
};

export type ListPublishedSummariesInput = {
  limit: number;
};

export interface IArtistProfileReader {
  load(artistId: string): Promise<ProfileState>;
  findPublishedByHandle(handle: string): Promise<PublishedProfile | null>;
  listPublishedSummaries(
    input: ListPublishedSummariesInput,
  ): Promise<PublishedProfileSummary[]>;
}

export interface IArtistProfileWriter {
  save(state: StoredProfile): Promise<StoredProfile>;
  publish(state: PublishedProfile): Promise<PublishedProfile>;
}

type ProfileImageUploadData = {
  artistId: string;
  image: ProfileImage;
  bytes: Uint8Array;
};

export interface IProfileImageStorage {
  upload(
    data: ProfileImageUploadData,
  ): Promise<Result<{ publicUrl: string }, ProfileImageUploadFailedError>>;
}
