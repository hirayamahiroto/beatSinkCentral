import { createTypedError } from "../../../../utils/errors/createTypedError";

export type ProfileImageUploadFailedError = Error & {
  readonly type: "ProfileImageUploadFailedError";
  readonly reason: string;
};

export const createProfileImageUploadFailedError = (
  reason: string,
): ProfileImageUploadFailedError =>
  createTypedError("ProfileImageUploadFailedError", { reason });
