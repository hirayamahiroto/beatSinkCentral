import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

type RegisteredArtistRef = {
  readonly artistId: string;
  readonly handle: string;
};

export type CoPerformer = {
  readonly name: string;
  readonly artist: RegisteredArtistRef | null;
};

export type InvalidCoPerformerFormatError = Error & {
  readonly type: "InvalidCoPerformerFormatError";
};

const createInvalidCoPerformerFormatError = (): InvalidCoPerformerFormatError =>
  createTypedError("InvalidCoPerformerFormatError");

const nameSchema = z
  .string()
  .trim()
  .min(1, "co-performer name is required")
  .max(255, "co-performer name must be 255 characters or less");

export type CoPerformerInput = {
  name: string;
  artist: RegisteredArtistRef | null;
};

export const createCoPerformer = (
  input: CoPerformerInput,
): Result<CoPerformer, InvalidCoPerformerFormatError> => {
  const name = nameSchema.safeParse(input.name);
  if (!name.success) {
    return err(createInvalidCoPerformerFormatError());
  }
  return ok({ name: name.data, artist: input.artist });
};
