import {
  createAccountIdAlreadyTakenError,
  type AccountIdAlreadyTakenError,
} from "../../../domain/artists/errors/accountIdAlreadyTaken";
import {
  createAccountId,
  type InvalidAccountIdFormatError,
} from "../../../domain/artists/valueObjects/accountId";
import type { ArtistWriteCapabilities } from "../../capabilities";
import { type Result, ok, err } from "../../../utils/result";

export type UpdateMyAccountIdInput = {
  accountId: string;
};

export type UpdateMyAccountIdOutput = {
  artistId: string;
  accountId: string;
};

export type UpdateMyAccountIdError =
  | InvalidAccountIdFormatError
  | AccountIdAlreadyTakenError;

type UpdateMyAccountIdCaps = Pick<ArtistWriteCapabilities, "actor" | "artists">;

export const updateMyAccountId = async (
  caps: UpdateMyAccountIdCaps,
  input: UpdateMyAccountIdInput,
): Promise<Result<UpdateMyAccountIdOutput, UpdateMyAccountIdError>> => {
  const parsed = createAccountId(input.accountId);
  if (!parsed.ok) return parsed;
  const newAccountId = parsed.value;

  const artist = caps.actor.artist;

  if (artist.hasAccountId(newAccountId)) {
    return ok({
      artistId: artist.getArtistId(),
      accountId: artist.getAccountId(),
    });
  }

  const taken = await caps.artists.findByAccountId(newAccountId.value);
  if (taken) {
    return err(createAccountIdAlreadyTakenError(taken.getAccountId()));
  }

  const updated = artist.changeAccountId(newAccountId);
  const saved = await caps.artists.updateAccountId({
    artistId: updated.getArtistId(),
    accountId: updated.getAccountId(),
  });

  return ok({
    artistId: saved.getArtistId(),
    accountId: saved.getAccountId(),
  });
};
