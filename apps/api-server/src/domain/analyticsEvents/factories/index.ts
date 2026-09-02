import {
  createEventType,
  type InvalidEventTypeFormatError,
} from "../valueObjects/eventType";
import { createAnalyticsEventBehaviors } from "../behaviors";
import type { AnalyticsEvent, AnalyticsEventState } from "../entities";
import { type Result, ok } from "../../../utils/result";

export type RecordEventInput = {
  eventType: string;
  artistId: string | null;
  anonId: string;
  sessionId: string;
  path: string;
  referrer: string | null;
  props: Record<string, unknown>;
};

const PROFILE_VIEW_EVENT_TYPE = "profile_view";

const extractFrom = (
  eventType: string,
  props: Record<string, unknown>,
): string | null => {
  if (eventType !== PROFILE_VIEW_EVENT_TYPE) return null;
  const value = props.from;
  return typeof value === "string" ? value : null;
};

const toStoredProps = (
  eventType: string,
  props: Record<string, unknown>,
): Record<string, unknown> | null => {
  const rest = { ...props };
  if (eventType === PROFILE_VIEW_EVENT_TYPE) {
    delete rest.from;
  }
  return Object.keys(rest).length > 0 ? rest : null;
};

export const createAnalyticsEvent = (
  input: RecordEventInput,
): Result<AnalyticsEvent, InvalidEventTypeFormatError> => {
  const eventType = createEventType(input.eventType);
  if (!eventType.ok) return eventType;

  const state: AnalyticsEventState = {
    id: crypto.randomUUID(),
    eventType: eventType.value,
    artistId: input.artistId,
    anonId: input.anonId,
    sessionId: input.sessionId,
    path: input.path,
    referrer: input.referrer,
    from: extractFrom(input.eventType, input.props),
    props: toStoredProps(input.eventType, input.props),
    occurredAt: new Date(),
  };

  return ok(createAnalyticsEventBehaviors(state));
};
