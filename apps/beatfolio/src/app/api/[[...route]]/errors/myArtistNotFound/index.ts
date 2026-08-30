import { createTypedError } from "../../../../../utils/errors/createTypedError";

export type MyArtistNotFoundError = Error & {
  readonly type: "MyArtistNotFoundError";
};

export const createMyArtistNotFoundError = (): MyArtistNotFoundError =>
  createTypedError("MyArtistNotFoundError");
