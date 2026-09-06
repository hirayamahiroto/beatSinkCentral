import type { EventType } from "../valueObjects/eventType";

export type AnalyticsEventState = {
  readonly id: string;
  readonly eventType: EventType;
  readonly artistId: string | null;
  readonly anonId: string;
  readonly sessionId: string;
  readonly path: string;
  readonly referrer: string | null;
  readonly from: string | null;
  readonly props: Record<string, unknown> | null;
  readonly occurredAt: Date;
};

export type AnalyticsEventPersistenceData = {
  id: string;
  eventType: string;
  artistId: string | null;
  anonId: string;
  sessionId: string;
  path: string;
  referrer: string | null;
  from: string | null;
  props: Record<string, unknown> | null;
  occurredAt: Date;
};

export type AnalyticsEvent = {
  getId: () => string;
  toPersistence: () => AnalyticsEventPersistenceData;
};
