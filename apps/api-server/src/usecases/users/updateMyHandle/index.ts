import {
  createHandleAlreadyTakenError,
  type HandleAlreadyTakenError,
} from "../../../domain/artists/errors/handleAlreadyTaken";
import {
  createHandle,
  type InvalidHandleFormatError,
} from "../../../domain/artists/valueObjects/handle";
import type { ArtistWriteCapabilities } from "../../capabilities";
import { type Result, ok, err } from "../../../utils/result";

export type UpdateMyHandleInput = {
  handle: string;
};

export type UpdateMyHandleOutput = {
  artistId: string;
  handle: string;
};

export type UpdateMyHandleError =
  | InvalidHandleFormatError
  | HandleAlreadyTakenError;

type UpdateMyHandleCaps = Pick<ArtistWriteCapabilities, "actor" | "artists">;

export const updateMyHandle = async (
  caps: UpdateMyHandleCaps,
  input: UpdateMyHandleInput,
): Promise<Result<UpdateMyHandleOutput, UpdateMyHandleError>> => {
  const parsed = createHandle(input.handle);
  if (!parsed.ok) return parsed;
  const newHandle = parsed.value;

  const artist = caps.actor.artist;

  if (artist.hasHandle(newHandle)) {
    return ok({
      artistId: artist.getArtistId(),
      handle: artist.getHandle(),
    });
  }

  const taken = await caps.artists.findByHandle(newHandle.value);
  if (taken) {
    return err(createHandleAlreadyTakenError(taken.getHandle()));
  }

  const updated = artist.changeHandle(newHandle);
  const saved = await caps.artists.updateHandle({
    artistId: updated.getArtistId(),
    handle: updated.getHandle(),
  });

  return ok({
    artistId: saved.getArtistId(),
    handle: saved.getHandle(),
  });
};
