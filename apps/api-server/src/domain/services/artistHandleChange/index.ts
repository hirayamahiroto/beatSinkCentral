import type { Artist } from "../../artists/entities";
import type { Handle } from "../../artists/valueObjects/handle";
import {
  createHandleAlreadyTakenError,
  type HandleAlreadyTakenError,
} from "../../artists/errors/handleAlreadyTaken";
import { createArtistHandleHistory } from "../../artistHandleHistories/factories";
import type { ArtistHandleHistory } from "../../artistHandleHistories/entities";
import { type Result, ok, err } from "../../../utils/result";

type ChangeArtistHandleInput = {
  artist: Artist;
  newHandle: Handle;
  changedByUserId: string;
};

type ChangeArtistHandleResult = {
  artist: Artist;
  history: ArtistHandleHistory;
};

export const changeArtistHandle = (
  input: ChangeArtistHandleInput,
  artistIfHandleTaken: Artist | null,
): Result<ChangeArtistHandleResult, HandleAlreadyTakenError> => {
  if (artistIfHandleTaken) {
    return err(createHandleAlreadyTakenError(artistIfHandleTaken.getHandle()));
  }

  const changed = input.artist.changeHandle(input.newHandle);
  const history = createArtistHandleHistory({
    artistId: input.artist.getArtistId(),
    oldHandle: input.artist.getHandle(),
    newHandle: changed.getHandle(),
    changedByUserId: input.changedByUserId,
  });

  return ok({ artist: changed, history });
};
