import { z } from "zod";
import { type Result, ok, err } from "../../../shared/result";
import { createSnsUrl, type InvalidSnsUrlFormatError } from "../snsUrl";

export type ProfileLink = {
  readonly _tag: "ProfileLink";
  readonly type: string;
  readonly url: string;
  readonly label: string | null;
};

export type InvalidProfileLinkFormatError = {
  readonly type: "InvalidProfileLinkFormatError";
};

export type ProfileLinkInput = {
  type: string;
  url: string;
  label?: string | null;
};

const typeSchema = z
  .string()
  .trim()
  .min(1, "link type is required")
  .max(50, "link type must be 50 characters or less");

const labelSchema = z
  .string()
  .trim()
  .max(100, "label must be 100 characters or less");

export const createProfileLink = (
  input: ProfileLinkInput,
): Result<
  ProfileLink,
  InvalidProfileLinkFormatError | InvalidSnsUrlFormatError
> => {
  const typeResult = typeSchema.safeParse(input.type);
  if (!typeResult.success) {
    return err({ type: "InvalidProfileLinkFormatError" });
  }

  const url = createSnsUrl(input.url);
  if (!url.ok) {
    return url;
  }

  const trimmedLabel = input.label?.trim() ?? "";
  if (trimmedLabel.length > 0 && !labelSchema.safeParse(trimmedLabel).success) {
    return err({ type: "InvalidProfileLinkFormatError" });
  }

  return ok({
    _tag: "ProfileLink",
    type: typeResult.data,
    url: url.value.value,
    label: trimmedLabel.length > 0 ? trimmedLabel : null,
  });
};
