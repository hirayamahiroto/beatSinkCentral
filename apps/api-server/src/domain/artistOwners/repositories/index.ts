import type { ArtistOwner, ArtistOwnerPersistenceData } from "../entities";
import type { TransactionContext } from "../../../infrastructure/transaction";

export interface IArtistOwnerRepository {
  save(
    data: ArtistOwnerPersistenceData,
    tx?: TransactionContext
  ): Promise<ArtistOwner>;
}
