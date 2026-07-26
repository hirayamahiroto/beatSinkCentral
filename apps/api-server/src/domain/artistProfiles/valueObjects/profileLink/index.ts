import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { createSnsUrl } from "../snsUrl";

export type ProfileLink = {
  readonly _tag: "ProfileLink";
  readonly type: string;
  readonly url: string;
  readonly label: string | null;
};

export type InvalidProfileLinkFormatError = Error & {
  readonly type: "InvalidProfileLinkFormatError";
};

export const createInvalidProfileLinkFormatError =
  (): InvalidProfileLinkFormatError =>
    createTypedError("InvalidProfileLinkFormatError");

const typeSchema = z
  .string()
  .trim()
  .min(1, "link type is required")
  .max(50, "link type must be 50 characters or less");

const labelSchema = z
  .string()
  .trim()
  .max(100, "label must be 100 characters or less");

export type ProfileLinkInput = {
  type: string;
  url: string;
  label?: string | null;
};

export const createProfileLink = (input: ProfileLinkInput): ProfileLink => {
  const typeResult = typeSchema.safeParse(input.type);
  if (!typeResult.success) {
    throw createInvalidProfileLinkFormatError();
  }

  const url = createSnsUrl(input.url).value;

  const trimmedLabel = input.label?.trim() ?? "";
  if (trimmedLabel.length > 0 && !labelSchema.safeParse(trimmedLabel).success) {
    throw createInvalidProfileLinkFormatError();
  }

  return {
    _tag: "ProfileLink",
    type: typeResult.data,
    url,
    label: trimmedLabel.length > 0 ? trimmedLabel : null,
  };
};
