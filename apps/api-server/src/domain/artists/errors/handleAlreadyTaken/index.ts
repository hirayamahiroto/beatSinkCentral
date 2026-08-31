import { createTypedError } from "../../../../utils/errors/createTypedError";

export type HandleAlreadyTakenError = Error & {
  readonly type: "HandleAlreadyTakenError";
  readonly handle: string;
};

export const createHandleAlreadyTakenError = (
  handle: string,
): HandleAlreadyTakenError =>
  createTypedError("HandleAlreadyTakenError", { handle });

export const isHandleAlreadyTakenError = (
  error: unknown,
): error is HandleAlreadyTakenError =>
  error instanceof Error &&
  "type" in error &&
  error.type === "HandleAlreadyTakenError";
