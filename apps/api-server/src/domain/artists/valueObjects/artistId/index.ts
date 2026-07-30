import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { ok, err, type Result } from "../../../../utils/result";

export type ArtistId = {
  readonly _tag: "ArtistId";
  readonly value: string;
};

export type InvalidArtistIdFormatError = Error & {
  readonly type: "InvalidArtistIdFormatError";
};

export const createInvalidArtistIdFormatError =
  (): InvalidArtistIdFormatError =>
    createTypedError("InvalidArtistIdFormatError");

const artistIdSchema = z.string().trim().min(1, "artistId is required");

export const createArtistId = (
  value: string,
): Result<ArtistId, InvalidArtistIdFormatError> => {
  const result = artistIdSchema.safeParse(value);
  if (!result.success) {
    return err(createInvalidArtistIdFormatError());
  }
  return ok({ _tag: "ArtistId", value: result.data });
};
