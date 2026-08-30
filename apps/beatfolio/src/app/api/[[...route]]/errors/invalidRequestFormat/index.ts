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
