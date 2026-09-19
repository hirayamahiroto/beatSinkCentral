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
