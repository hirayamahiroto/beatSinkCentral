import type { ZodIssue } from "zod";
import { createTypedError } from "../../../../../utils/errors/createTypedError";

export type ResponseContractViolationError = Error & {
  readonly type: "ResponseContractViolationError";
  readonly issues: ReadonlyArray<ZodIssue>;
};

export const createResponseContractViolationError = (
  issues: ReadonlyArray<ZodIssue>,
): ResponseContractViolationError =>
  createTypedError("ResponseContractViolationError", { issues });
