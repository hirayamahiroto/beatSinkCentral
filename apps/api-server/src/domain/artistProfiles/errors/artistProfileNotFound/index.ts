import { createTypedError } from "../../../../utils/errors/createTypedError";

export type ArtistProfileNotFoundError = Error & {
  readonly type: "ArtistProfileNotFoundError";
};

export const createArtistProfileNotFoundError =
  (): ArtistProfileNotFoundError =>
    createTypedError("ArtistProfileNotFoundError");
