import {
  isHandleAlreadyTakenError,
  type HandleAlreadyTakenError,
} from "../../../domain/artists/errors/handleAlreadyTaken";
import {
  isEmailAlreadyTakenError,
  type EmailAlreadyTakenError,
} from "../../../domain/users/errors/emailAlreadyTaken";
import { type Result, err } from "../../../utils/result";

export type AlreadyTakenError =
  | HandleAlreadyTakenError
  | EmailAlreadyTakenError;

export const isAlreadyTakenError = (
  error: unknown,
): error is AlreadyTakenError =>
  isHandleAlreadyTakenError(error) || isEmailAlreadyTakenError(error);

export const catchAlreadyTaken = async <T, E, Conflict>(
  isConflict: (error: unknown) => error is Conflict,
  run: () => Promise<Result<T, E>>,
): Promise<Result<T, E | Conflict>> => {
  try {
    return await run();
  } catch (error) {
    if (isConflict(error)) return err(error);
    throw error;
  }
};
