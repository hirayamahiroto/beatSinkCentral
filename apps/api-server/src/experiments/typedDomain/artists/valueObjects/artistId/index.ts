import { type Result, ok, err } from "../../../shared/result";

export type ArtistId = {
  readonly _tag: "ArtistId";
  readonly value: string;
};

export type InvalidArtistIdFormatError = {
  readonly type: "InvalidArtistIdFormatError";
};

const isValidArtistId = (value: string): boolean => value.length >= 1;

export const createArtistId = (
  value: string,
): Result<ArtistId, InvalidArtistIdFormatError> => {
  const trimmed = value.trim();
  if (!isValidArtistId(trimmed)) {
    return err({ type: "InvalidArtistIdFormatError" });
  }
  return ok({ _tag: "ArtistId", value: trimmed });
};
