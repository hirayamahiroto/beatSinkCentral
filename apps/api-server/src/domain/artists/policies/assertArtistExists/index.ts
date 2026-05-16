import type { Artist } from "../../entities";
import { createTypedError } from "../../../../utils/errors/createTypedError";

export type ArtistNotFoundError = Error & {
  readonly type: "ArtistNotFoundError";
};

export const createArtistNotFoundError = (): ArtistNotFoundError =>
  createTypedError("ArtistNotFoundError");

export const isArtistNotFoundError = (
  error: unknown,
): error is ArtistNotFoundError => {
  return (
    error instanceof Error &&
    (error as Partial<ArtistNotFoundError>).type === "ArtistNotFoundError"
  );
};

export const assertArtistExists: (
  artist: Artist | null,
) => asserts artist is Artist = (artist) => {
  if (!artist) {
    throw createArtistNotFoundError();
  }
};
