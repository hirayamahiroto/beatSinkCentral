import type { AnalyticsEvent, AnalyticsEventState } from "../entities";

export const createAnalyticsEventBehaviors = (
  state: AnalyticsEventState,
): AnalyticsEvent => ({
  getId: () => state.id,
  toPersistence: () => ({
    id: state.id,
    eventType: state.eventType.value,
    artistId: state.artistId,
    anonId: state.anonId,
    sessionId: state.sessionId,
    path: state.path,
    referrer: state.referrer,
    from: state.from,
    props: state.props,
    occurredAt: state.occurredAt,
  }),
});
