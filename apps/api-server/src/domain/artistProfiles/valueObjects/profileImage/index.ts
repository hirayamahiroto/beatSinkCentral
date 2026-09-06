import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

type ProfileImageContentType = "image/jpeg" | "image/png" | "image/webp";

type ProfileImageExtension = "jpg" | "png" | "webp";

export type ProfileImage = {
  readonly contentType: ProfileImageContentType;
  readonly sizeBytes: number;
  readonly extension: ProfileImageExtension;
};

export type UnsupportedImageTypeError = Error & {
  readonly type: "UnsupportedImageTypeError";
};

const createUnsupportedImageTypeError = (): UnsupportedImageTypeError =>
  createTypedError("UnsupportedImageTypeError");

export type ImageTooLargeError = Error & {
  readonly type: "ImageTooLargeError";
};

const createImageTooLargeError = (): ImageTooLargeError =>
  createTypedError("ImageTooLargeError");

export type EmptyImageFileError = Error & {
  readonly type: "EmptyImageFileError";
};

const createEmptyImageFileError = (): EmptyImageFileError =>
  createTypedError("EmptyImageFileError");

export const PROFILE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

type SupportedImageFormat = {
  contentType: ProfileImageContentType;
  extension: ProfileImageExtension;
};

const resolveSupportedFormat = (
  contentType: string,
): SupportedImageFormat | null => {
  switch (contentType) {
    case "image/jpeg":
      return { contentType, extension: "jpg" };
    case "image/png":
      return { contentType, extension: "png" };
    case "image/webp":
      return { contentType, extension: "webp" };
    default:
      return null;
  }
};

export type CreateProfileImageInput = {
  contentType: string;
  sizeBytes: number;
};

export type ProfileImageError =
  | UnsupportedImageTypeError
  | ImageTooLargeError
  | EmptyImageFileError;

export const createProfileImage = ({
  contentType,
  sizeBytes,
}: CreateProfileImageInput): Result<ProfileImage, ProfileImageError> => {
  const format = resolveSupportedFormat(contentType);
  if (format === null) {
    return err(createUnsupportedImageTypeError());
  }
  if (sizeBytes <= 0) {
    return err(createEmptyImageFileError());
  }
  if (sizeBytes > PROFILE_IMAGE_MAX_SIZE_BYTES) {
    return err(createImageTooLargeError());
  }
  return ok({
    contentType: format.contentType,
    sizeBytes,
    extension: format.extension,
  });
};
