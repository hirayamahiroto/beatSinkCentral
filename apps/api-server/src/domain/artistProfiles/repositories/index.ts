import type {
  ArtistProfile,
  ArtistProfilePersistenceData,
  PublishedProfile,
} from "../entities";
import type { TransactionContext } from "../../../infrastructure/transaction";

export type ArtistProfileSaveData = ArtistProfilePersistenceData;

export type ArtistProfileSetPublishedData = {
  artistId: string;
  published: boolean;
};

export interface IArtistProfileRepository {
  findByArtistId(
    artistId: string,
    tx?: TransactionContext,
  ): Promise<ArtistProfile | null>;

  findPublishedByAccountId(accountId: string): Promise<PublishedProfile | null>;

  upsert(
    data: ArtistProfileSaveData,
    tx?: TransactionContext,
  ): Promise<ArtistProfile>;

  setPublished(
    data: ArtistProfileSetPublishedData,
    tx?: TransactionContext,
  ): Promise<ArtistProfile>;
}
