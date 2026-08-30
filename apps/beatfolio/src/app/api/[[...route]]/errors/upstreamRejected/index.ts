import type { ClientErrorStatusCode } from "hono/utils/http-status";
import { createTypedError } from "../../../../../utils/errors/createTypedError";

export type UpstreamErrorBody = {
  error: string;
  code: string;
} & Record<string, unknown>;

export type UpstreamRejectedError = Error & {
  readonly type: "UpstreamRejectedError";
  readonly status: ClientErrorStatusCode;
  readonly body: UpstreamErrorBody;
};

export const createUpstreamRejectedError = (input: {
  status: ClientErrorStatusCode;
  body: UpstreamErrorBody;
}): UpstreamRejectedError =>
  createTypedError("UpstreamRejectedError", {
    status: input.status,
    body: input.body,
  });
