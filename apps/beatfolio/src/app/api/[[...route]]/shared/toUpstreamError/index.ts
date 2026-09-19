import { z } from "zod";
import type { ClientErrorStatusCode } from "hono/utils/http-status";
import {
  createUpstreamRejectedError,
  type UpstreamRejectedError,
} from "../../errors/upstreamRejected";
import {
  createUpstreamServerError,
  type UpstreamServerError,
} from "../../errors/upstreamServerError";
import {
  createUpstreamContractViolationError,
  type UpstreamContractViolationError,
} from "../../errors/upstreamContractViolation";

export type UpstreamResponse = {
  status: number;
  json: () => Promise<unknown>;
};

const CLIENT_ERROR_STATUSES: readonly ClientErrorStatusCode[] = [
  400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414,
  415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451,
];

const upstreamErrorBodySchema = z
  .object({ error: z.string().min(1), code: z.string().min(1) })
  .passthrough();

const readBody = async (res: UpstreamResponse): Promise<unknown> => {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
};

export type UpstreamResponseError =
  | UpstreamRejectedError
  | UpstreamServerError
  | UpstreamContractViolationError;

export const toUpstreamError = async (
  res: UpstreamResponse,
): Promise<UpstreamResponseError> => {
  if (res.status >= 500) {
    return createUpstreamServerError(res.status);
  }

  const status = CLIENT_ERROR_STATUSES.find((code) => code === res.status);
  if (status === undefined) {
    return createUpstreamContractViolationError({
      upstreamStatus: res.status,
      reason: "unexpected status",
    });
  }

  const parsed = upstreamErrorBodySchema.safeParse(await readBody(res));
  if (!parsed.success) {
    return createUpstreamContractViolationError({
      upstreamStatus: res.status,
      reason: "error body without code",
    });
  }

  return createUpstreamRejectedError({ status, body: parsed.data });
};
