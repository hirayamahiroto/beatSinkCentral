import { createTypedError } from "../../../../utils/errors/createTypedError";

export type CoPerformerNotFoundError = Error & {
  readonly type: "CoPerformerNotFoundError";
  readonly handle: string;
};

export const createCoPerformerNotFoundError = (
  handle: string,
): CoPerformerNotFoundError =>
  createTypedError("CoPerformerNotFoundError", { handle });
