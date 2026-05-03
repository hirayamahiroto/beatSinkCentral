import type { Artist, ArtistPersistenceData } from "../entities";
import type { TransactionContext } from "../../../infrastructure/transaction";

export interface IArtistRepository {
  save(data: ArtistPersistenceData, tx?: TransactionContext): Promise<Artist>;
  findByUserId(userId: string): Promise<Artist | null>;
  findByAccountId(
    accountId: string,
    tx?: TransactionContext,
  ): Promise<Artist | null>;
}
