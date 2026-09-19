import { analyticsEventsTable } from "../../../../../../packages/database/src/utils/createClient";
import type { IAnalyticsEventWriter } from "../../../domain/analyticsEvents/repositories";
import type { AnalyticsEventPersistenceData } from "../../../domain/analyticsEvents/entities";
import type { Executor } from "../../transaction";

export const createAnalyticsEventWriter = (
  executor: Executor,
): IAnalyticsEventWriter => ({
  async record(data: AnalyticsEventPersistenceData): Promise<void> {
    await executor.insert(analyticsEventsTable).values({
      id: data.id,
      eventType: data.eventType,
      artistId: data.artistId,
      anonId: data.anonId,
      sessionId: data.sessionId,
      path: data.path,
      referrer: data.referrer,
      from: data.from,
      props: data.props,
      occurredAt: data.occurredAt,
    });
  },
});
