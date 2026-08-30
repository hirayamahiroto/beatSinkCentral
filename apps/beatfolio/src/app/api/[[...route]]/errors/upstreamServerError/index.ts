import { createTypedError } from "../../../../../utils/errors/createTypedError";

export type UpstreamServerError = Error & {
  readonly type: "UpstreamServerError";
  readonly upstreamStatus: number;
};

export const createUpstreamServerError = (
  upstreamStatus: number,
): UpstreamServerError =>
  createTypedError("UpstreamServerError", { upstreamStatus });
