import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { createSnsUrl, type InvalidSnsUrlFormatError } from "../snsUrl";
import { type Result, err, map } from "../../../../utils/result";

export type ProfileLink = {
  readonly linkTypeCode: string;
  readonly url: string;
};

export type InvalidProfileLinkFormatError = Error & {
  readonly type: "InvalidProfileLinkFormatError";
};

export const createInvalidProfileLinkFormatError =
  (): InvalidProfileLinkFormatError =>
    createTypedError("InvalidProfileLinkFormatError");

const linkTypeCodeSchema = z
  .string()
  .trim()
  .min(1, "link type is required")
  .max(50, "link type must be 50 characters or less");

export type ProfileLinkInput = {
  linkTypeCode: string;
  url: string;
};

export type CreateProfileLinkError =
  | InvalidProfileLinkFormatError
  | InvalidSnsUrlFormatError;

export const createProfileLink = (
  input: ProfileLinkInput,
): Result<ProfileLink, CreateProfileLinkError> => {
  const linkTypeCode = linkTypeCodeSchema.safeParse(input.linkTypeCode);
  if (!linkTypeCode.success) {
    return err(createInvalidProfileLinkFormatError());
  }

  return map(createSnsUrl(input.url), (url) => ({
    linkTypeCode: linkTypeCode.data,
    url: url.value,
  }));
};
