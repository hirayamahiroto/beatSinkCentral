import type { AnalyticsEventPersistenceData } from "../entities";

export interface IAnalyticsEventWriter {
  record(data: AnalyticsEventPersistenceData): Promise<void>;
}
