import { createTypedError } from "../../../../../utils/errors/createTypedError";
import type { UpstreamUnavailableError } from "../../../../../utils/client/errors/upstreamUnavailable";
import type { SaveStep } from "../../../../../libs/saveProfileProgress";
import type { UpstreamServerError } from "../upstreamServerError";
import type { UpstreamContractViolationError } from "../upstreamContractViolation";
import type { UpstreamRejectedError } from "../upstreamRejected";

export type UpstreamFailure =
  | UpstreamUnavailableError
  | UpstreamServerError
  | UpstreamContractViolationError
  | UpstreamRejectedError;

export type PartialSaveFailedError = Error & {
  readonly type: "PartialSaveFailedError";
  readonly saved: readonly SaveStep[];
  readonly failedAt: SaveStep;
  readonly upstream: UpstreamFailure;
};

export const createPartialSaveFailedError = (input: {
  saved: readonly SaveStep[];
  failedAt: SaveStep;
  upstream: UpstreamFailure;
}): PartialSaveFailedError =>
  createTypedError("PartialSaveFailedError", {
    saved: input.saved,
    failedAt: input.failedAt,
    upstream: input.upstream,
  });
