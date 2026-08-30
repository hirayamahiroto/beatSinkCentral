import { createTypedError } from "../../../../../utils/errors/createTypedError";

export type UpstreamContractViolationError = Error & {
  readonly type: "UpstreamContractViolationError";
  readonly upstreamStatus: number;
  readonly reason: string;
};

export const createUpstreamContractViolationError = (input: {
  upstreamStatus: number;
  reason: string;
}): UpstreamContractViolationError =>
  createTypedError("UpstreamContractViolationError", {
    upstreamStatus: input.upstreamStatus,
    reason: input.reason,
  });
