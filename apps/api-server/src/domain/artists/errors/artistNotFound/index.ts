import { createTypedError } from "../../../../utils/errors/createTypedError";

export type ArtistNotFoundError = Error & {
  readonly type: "ArtistNotFoundError";
};

export const createArtistNotFoundError = (): ArtistNotFoundError =>
  createTypedError("ArtistNotFoundError");

export const isArtistNotFoundError = (
  error: unknown,
): error is ArtistNotFoundError =>
  error instanceof Error &&
  "type" in error &&
  error.type === "ArtistNotFoundError";
