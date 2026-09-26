import type { HandleAlreadyTakenError } from "../../domain/artists/errors/handleAlreadyTaken";
import type { EmailAlreadyTakenError } from "../../domain/users/errors/emailAlreadyTaken";
import { createErrorChannel } from "../../utils/errors/errorChannel";
import { type Result, err } from "../../utils/result";

export type AlreadyTakenError =
  | HandleAlreadyTakenError
  | EmailAlreadyTakenError;

const alreadyTaken = createErrorChannel<AlreadyTakenError>();

export const raiseAlreadyTaken: (conflict: AlreadyTakenError) => never =
  alreadyTaken.raise;

export const anyAlreadyTaken = (conflict: AlreadyTakenError) => conflict;

export const catchAlreadyTaken = async <T, E, Conflict>(
  select: (conflict: AlreadyTakenError) => Conflict | null,
  run: () => Promise<Result<T, E>>,
): Promise<Result<T, E | Conflict>> => {
  try {
    return await run();
  } catch (error) {
    const conflict = alreadyTaken.recover(error);
    const selected = conflict === null ? null : select(conflict);
    if (selected === null) throw error;
    return err(selected);
  }
};
