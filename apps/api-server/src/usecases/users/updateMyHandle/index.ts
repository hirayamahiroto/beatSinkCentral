import type { HandleAlreadyTakenError } from "../../../domain/artists/errors/handleAlreadyTaken";
import {
  createHandle,
  type InvalidHandleFormatError,
} from "../../../domain/artists/valueObjects/handle";
import { changeArtistHandle } from "../../../domain/services/artistHandleChange";
import type { ArtistWriteCapabilities } from "../../capabilities";
import { type Result, ok } from "../../../utils/result";

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

type UpdateMyHandleCaps = Pick<
  ArtistWriteCapabilities,
  "actor" | "artists" | "artistHandleHistories"
>;

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

  const artistIfHandleTaken = await caps.artists.findByHandle(newHandle.value);
  const changed = changeArtistHandle(
    { artist, newHandle, changedByUserId: caps.actor.user.getId() },
    artistIfHandleTaken,
  );
  if (!changed.ok) return changed;

  const saved = await caps.artists.updateHandle({
    artistId: changed.value.artist.getArtistId(),
    handle: changed.value.artist.getHandle(),
  });
  await caps.artistHandleHistories.record(
    changed.value.history.toPersistence(),
  );

  return ok({
    artistId: saved.getArtistId(),
    handle: saved.getHandle(),
  });
};
