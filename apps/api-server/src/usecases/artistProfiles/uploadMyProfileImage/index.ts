import {
  createProfileImage,
  type ProfileImageError,
} from "../../../domain/artistProfiles/valueObjects/profileImage";
import type { ProfileImageUploadFailedError } from "../../../domain/artistProfiles/errors/profileImageUploadFailed";
import type { ArtistStorageWriteCapabilities } from "../../capabilities";
import { type Result, ok, err } from "../../../utils/result";

export type UploadMyProfileImageInput = {
  contentType: string;
  sizeBytes: number;
  bytes: Promise<Uint8Array>;
};

export type UploadMyProfileImageOutput = {
  imageUrl: string;
};

export type UploadMyProfileImageError =
  | ProfileImageError
  | ProfileImageUploadFailedError;

export const uploadMyProfileImage = async (
  caps: ArtistStorageWriteCapabilities,
  input: UploadMyProfileImageInput,
): Promise<Result<UploadMyProfileImageOutput, UploadMyProfileImageError>> => {
  const image = createProfileImage({
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
  });
  if (!image.ok) return err(image.error);

  const uploaded = await caps.profileImages.upload({
    artistId: caps.actor.artist.getArtistId(),
    image: image.value,
    bytes: input.bytes,
  });
  if (!uploaded.ok) return err(uploaded.error);

  return ok({ imageUrl: uploaded.value.publicUrl });
};
