import type { ArtistProfile } from "../../entities";
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

export const assertArtistProfileExists: (
  profile: ArtistProfile | null,
) => asserts profile is ArtistProfile = (profile) => {
  if (!profile) {
    throw createArtistProfileNotFoundError();
  }
};
