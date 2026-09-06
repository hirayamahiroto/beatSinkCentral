import { createMiddleware } from "hono/factory";
import {
  runWithRequestContext,
  type RequestContext,
} from "../../utils/requestContext";

const TRACEPARENT_PATTERN =
  /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-[0-9a-f]{2}$/;
const INVALID_VERSION = "ff";
const UNSET_TRACE_ID = "0".repeat(32);
const UNSET_PARENT_ID = "0".repeat(16);

export const parseTraceId = (
  traceparent: string | undefined,
): string | undefined => {
  if (traceparent === undefined) return undefined;
  const matched = TRACEPARENT_PATTERN.exec(traceparent);
  if (matched === null) return undefined;
  const [, version, traceId, parentId] = matched;
  if (version === INVALID_VERSION) return undefined;
  if (traceId === UNSET_TRACE_ID) return undefined;
  if (parentId === UNSET_PARENT_ID) return undefined;
  return traceId;
};

type IncomingCorrelationHeaders = {
  requestId: string | undefined;
  vercelId: string | undefined;
  traceparent: string | undefined;
};

const nonEmpty = (value: string | undefined): string | undefined =>
  value === undefined || value === "" ? undefined : value;

export const buildRequestContext = ({
  requestId,
  vercelId,
  traceparent,
}: IncomingCorrelationHeaders): RequestContext => {
  const resolvedRequestId =
    nonEmpty(requestId) ?? nonEmpty(vercelId) ?? crypto.randomUUID();
  const traceId = parseTraceId(traceparent);
  if (traceId === undefined) return { requestId: resolvedRequestId };
  return { requestId: resolvedRequestId, traceId };
};

export const requestContextMiddleware = createMiddleware((c, next) =>
  runWithRequestContext(
    buildRequestContext({
      requestId: c.req.header("x-request-id"),
      vercelId: c.req.header("x-vercel-id"),
      traceparent: c.req.header("traceparent"),
    }),
    () => next(),
  ),
);
