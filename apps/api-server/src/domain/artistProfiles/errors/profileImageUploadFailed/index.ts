import { createTypedError } from "../../../../utils/errors/createTypedError";

export type ProfileImageUploadFailedError = Error & {
  readonly type: "ProfileImageUploadFailedError";
};

export const createProfileImageUploadFailedError =
  (): ProfileImageUploadFailedError =>
    createTypedError("ProfileImageUploadFailedError");
