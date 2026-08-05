import { createMiddleware } from "hono/factory";
import {
  runWithRequestContext,
  type RequestContext,
} from "../../utils/requestContext";

const TRACEPARENT_PATTERN =
  /^[0-9a-f]{2}-([0-9a-f]{32})-[0-9a-f]{16}-[0-9a-f]{2}$/;
const UNSET_TRACE_ID = "0".repeat(32);

export const parseTraceId = (
  traceparent: string | undefined,
): string | undefined => {
  if (traceparent === undefined) return undefined;
  const matched = TRACEPARENT_PATTERN.exec(traceparent);
  if (matched === null) return undefined;
  const [, traceId] = matched;
  if (traceId === UNSET_TRACE_ID) return undefined;
  return traceId;
};

type IncomingCorrelationHeaders = {
  requestId: string | undefined;
  vercelId: string | undefined;
  traceparent: string | undefined;
};

export const buildRequestContext = ({
  requestId,
  vercelId,
  traceparent,
}: IncomingCorrelationHeaders): RequestContext => {
  const resolvedRequestId = requestId ?? vercelId ?? crypto.randomUUID();
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
