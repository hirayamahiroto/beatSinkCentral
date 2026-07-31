import { createTypedError } from "../../../../utils/errors/createTypedError";

export type ArtistProfileNotFoundError = Error & {
  readonly type: "ArtistProfileNotFoundError";
};

export const createArtistProfileNotFoundError =
  (): ArtistProfileNotFoundError =>
    createTypedError("ArtistProfileNotFoundError");

export const isArtistProfileNotFoundError = (
  error: unknown,
): error is ArtistProfileNotFoundError =>
  error instanceof Error &&
  (error as Partial<ArtistProfileNotFoundError>).type ===
    "ArtistProfileNotFoundError";
