import type { ArtistHandleHistoryPersistenceData } from "../entities";

export interface IArtistHandleHistoryWriter {
  record(data: ArtistHandleHistoryPersistenceData): Promise<void>;
}
