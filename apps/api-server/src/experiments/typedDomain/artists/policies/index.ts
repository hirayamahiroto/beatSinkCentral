import { type Result, ok, err } from "../../shared/result";
import type { Artist } from "../artist";

export type AccountIdAlreadyTakenError = {
  readonly type: "AccountIdAlreadyTakenError";
};

export const assertAccountIdAvailable = (
  existingArtist: Artist | null,
): Result<void, AccountIdAlreadyTakenError> =>
  existingArtist ? err({ type: "AccountIdAlreadyTakenError" }) : ok(undefined);
