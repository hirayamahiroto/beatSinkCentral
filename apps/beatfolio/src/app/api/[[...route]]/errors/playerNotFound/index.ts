import { createTypedError } from "../../../../../utils/errors/createTypedError";

export type PlayerNotFoundError = Error & {
  readonly type: "PlayerNotFoundError";
};

export const createPlayerNotFoundError = (): PlayerNotFoundError =>
  createTypedError("PlayerNotFoundError");
