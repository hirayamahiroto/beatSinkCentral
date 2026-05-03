import type { ZodIssue } from "zod";
import { createTypedError } from "../../../../../utils/errors/createTypedError";

export type InvalidRequestFormatError = Error & {
  readonly type: "InvalidRequestFormatError";
  readonly issues: ReadonlyArray<ZodIssue>;
};

export const createInvalidRequestFormatError = (
  issues: ReadonlyArray<ZodIssue>,
): InvalidRequestFormatError =>
  createTypedError("InvalidRequestFormatError", { issues });

export const isInvalidRequestFormatError = (
  error: unknown,
): error is InvalidRequestFormatError => {
  return (
    error instanceof Error &&
    (error as Partial<InvalidRequestFormatError>).type ===
      "InvalidRequestFormatError"
  );
};
