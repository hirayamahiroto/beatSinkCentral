import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { createSnsUrl, type InvalidSnsUrlFormatError } from "../snsUrl";
import { type Result, ok, err, map } from "../../../../utils/result";

export type ProfileLink = {
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

export type CreateProfileLinkError =
  | InvalidProfileLinkFormatError
  | InvalidSnsUrlFormatError;

const parseLabel = (
  label: string | null | undefined,
): Result<string | null, InvalidProfileLinkFormatError> => {
  const trimmed = label?.trim();
  if (trimmed === undefined || trimmed.length === 0) return ok(null);
  if (!labelSchema.safeParse(trimmed).success) {
    return err(createInvalidProfileLinkFormatError());
  }
  return ok(trimmed);
};

export const createProfileLink = (
  input: ProfileLinkInput,
): Result<ProfileLink, CreateProfileLinkError> => {
  const type = typeSchema.safeParse(input.type);
  if (!type.success) {
    return err(createInvalidProfileLinkFormatError());
  }

  const label = parseLabel(input.label);
  if (!label.ok) return label;

  return map(createSnsUrl(input.url), (url) => ({
    type: type.data,
    url: url.value,
    label: label.value,
  }));
};
