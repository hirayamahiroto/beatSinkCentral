import { z } from "zod";

export type ArtistId = {
  readonly value: string;
};

const artistIdSchema = z.string().trim().min(1, "artistId is required");

export const createArtistId = (value: string): ArtistId => {
  const parsed = artistIdSchema.parse(value);
  return { value: parsed };
};
