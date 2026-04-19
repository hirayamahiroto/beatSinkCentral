import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";

export type ArtistId = {
  readonly value: string;
};

export type InvalidArtistIdFormatError = Error & {
  readonly type: "InvalidArtistIdFormatError";
};

export const createInvalidArtistIdFormatError =
  (): InvalidArtistIdFormatError =>
    createTypedError("InvalidArtistIdFormatError");

const artistIdSchema = z.string().trim().min(1, "artistId is required");

export const createArtistId = (value: string): ArtistId => {
  const result = artistIdSchema.safeParse(value);
  if (!result.success) {
    throw createInvalidArtistIdFormatError();
  }
  return { value: result.data };
};
