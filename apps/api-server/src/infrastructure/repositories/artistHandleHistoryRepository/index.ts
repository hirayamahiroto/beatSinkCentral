import { artistHandleHistoriesTable } from "../../../../../../packages/database/src/utils/createClient";
import type { IArtistHandleHistoryWriter } from "../../../domain/artistHandleHistories/repositories";
import type { ArtistHandleHistoryPersistenceData } from "../../../domain/artistHandleHistories/entities";
import type { Executor } from "../../transaction";

export const createArtistHandleHistoryWriter = (
  executor: Pick<Executor, "insert">,
): IArtistHandleHistoryWriter => ({
  async record(data: ArtistHandleHistoryPersistenceData): Promise<void> {
    await executor.insert(artistHandleHistoriesTable).values({
      id: data.id,
      artistId: data.artistId,
      oldHandle: data.oldHandle,
      newHandle: data.newHandle,
      changedByUserId: data.changedByUserId,
    });
  },
});
