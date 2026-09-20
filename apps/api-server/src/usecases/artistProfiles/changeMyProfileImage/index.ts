import {
  createImageUrl,
  type InvalidImageUrlFormatError,
} from "../../../domain/artistProfiles/valueObjects/imageUrl";
import { changeImage } from "../../../domain/artistProfiles/behaviors";
import { edit } from "../../../domain/artistProfiles/policies/publishability";
import type { ArtistWriteCapabilities } from "../../../capabilities";
import { type Result, ok } from "../../../utils/result";

export type ChangeMyProfileImageInput = {
  imageUrl: string;
};

export type ChangeMyProfileImageOutput = {
  imageUrl: string;
};

export type ChangeMyProfileImageError = InvalidImageUrlFormatError;

type ChangeMyProfileImageCaps = Pick<
  ArtistWriteCapabilities,
  "actor" | "artistProfiles"
>;

export const changeMyProfileImage = async (
  caps: ChangeMyProfileImageCaps,
  input: ChangeMyProfileImageInput,
): Promise<Result<ChangeMyProfileImageOutput, ChangeMyProfileImageError>> => {
  const imageUrl = createImageUrl(input.imageUrl);
  if (!imageUrl.ok) return imageUrl;

  const state = await caps.artistProfiles.load(caps.actor.artist.getArtistId());
  await caps.artistProfiles.save(
    edit(state, (content) => changeImage(content, imageUrl.value)),
  );

  return ok({ imageUrl: imageUrl.value.value });
};
