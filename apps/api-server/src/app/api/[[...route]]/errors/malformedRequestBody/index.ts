import { createTypedError } from "../../../../../utils/errors/createTypedError";

export type MalformedRequestBodyError = Error & {
  readonly type: "MalformedRequestBodyError";
};

export const createMalformedRequestBodyError = (): MalformedRequestBodyError =>
  createTypedError("MalformedRequestBodyError");

export const isMalformedRequestBodyError = (
  error: unknown,
): error is MalformedRequestBodyError => {
  return (
    error instanceof Error &&
    (error as Partial<MalformedRequestBodyError>).type ===
      "MalformedRequestBodyError"
  );
};
