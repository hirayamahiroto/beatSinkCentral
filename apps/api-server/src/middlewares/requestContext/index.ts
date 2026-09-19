import { createMiddleware } from "hono/factory";
import {
  runWithRequestContext,
  type RequestContext,
} from "../../utils/requestContext";
import { parseTraceId } from "../../utils/traceparent";

type IncomingCorrelationHeaders = {
  requestId: string | undefined;
  vercelId: string | undefined;
  traceparent: string | undefined;
};

const nonEmpty = (value: string | undefined): string | undefined =>
  value === undefined || value === "" ? undefined : value;

const buildRequestContext = ({
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
