import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

export type OfferComment = {
  readonly value: string;
};

export type InvalidOfferCommentFormatError = Error & {
  readonly type: "InvalidOfferCommentFormatError";
};

const createInvalidOfferCommentFormatError =
  (): InvalidOfferCommentFormatError =>
    createTypedError("InvalidOfferCommentFormatError");

const offerCommentSchema = z
  .string()
  .trim()
  .min(1, "comment is required")
  .max(500, "comment must be 500 characters or less");

export const createOfferComment = (
  value: string,
): Result<OfferComment, InvalidOfferCommentFormatError> => {
  const result = offerCommentSchema.safeParse(value);
  if (!result.success) {
    return err(createInvalidOfferCommentFormatError());
  }
  return ok({ value: result.data });
};
