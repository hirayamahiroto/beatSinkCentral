import {
  DatabaseClient,
  artistOwnersTable,
} from "../../../../../../packages/database/src/utils/createClient";
import type { IArtistOwnerRepository } from "../../../domain/artistOwners/repositories";
import type {
  ArtistOwner,
  ArtistOwnerPersistenceData,
} from "../../../domain/artistOwners/entities";
import { reconstructArtistOwner } from "../../../domain/artistOwners/factories";
import type { TransactionContext } from "../../transaction";

export const createArtistOwnerRepository = (
  db: DatabaseClient
): IArtistOwnerRepository => ({
  async save(
    data: ArtistOwnerPersistenceData,
    tx?: TransactionContext
  ): Promise<ArtistOwner> {
    const executor = tx ?? db;
    const [result] = await executor
      .insert(artistOwnersTable)
      .values({
        id: data.id,
        userId: data.userId,
        artistId: data.artistId,
      })
      .returning({
        id: artistOwnersTable.id,
        userId: artistOwnersTable.userId,
        artistId: artistOwnersTable.artistId,
      });

    return reconstructArtistOwner({
      id: result.id,
      userId: result.userId,
      artistId: result.artistId,
    });
  },
});
