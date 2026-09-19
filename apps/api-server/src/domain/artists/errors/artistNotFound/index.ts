import { createTypedError } from "../../../../utils/errors/createTypedError";

export type ArtistNotFoundError = Error & {
  readonly type: "ArtistNotFoundError";
};

export const createArtistNotFoundError = (): ArtistNotFoundError =>
  createTypedError("ArtistNotFoundError");
