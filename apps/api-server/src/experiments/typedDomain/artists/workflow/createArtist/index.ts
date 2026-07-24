import { type Result, err, flatMap, map } from "../../../shared/result";
import {
  createAccountId,
  type InvalidAccountIdFormatError,
} from "../../valueObjects/accountId";
import {
  createArtistId,
  type InvalidArtistIdFormatError,
} from "../../valueObjects/artistId";
import type { Artist } from "../../artist";

export type AccountIdAlreadyTakenError = {
  readonly type: "AccountIdAlreadyTakenError";
};

export type CreateArtistError =
  | InvalidAccountIdFormatError
  | InvalidArtistIdFormatError
  | AccountIdAlreadyTakenError;

export type CreateArtistInput = {
  readonly accountId: string;
  readonly ownerUserId: string;
};

export const createArtist = (
  input: CreateArtistInput,
  existingArtist: Artist | null,
  newArtistId: string,
): Result<Artist, CreateArtistError> => {
  if (existingArtist) {
    return err({ type: "AccountIdAlreadyTakenError" });
  }

  return flatMap(createAccountId(input.accountId), (accountId) =>
    map(createArtistId(newArtistId), (artistId) => ({
      artistId,
      accountId,
      ownerUserId: input.ownerUserId,
      profile: null,
    })),
  );
};
