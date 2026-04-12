import { eq } from "drizzle-orm";
import {
  DatabaseClient,
  artistsTable,
  artistOwnersTable,
  artistProfilesTable,
} from "../../../../../../packages/database/src/utils/createClient";
import type { IArtistRepository } from "../../../domain/artists/repositories";
import type {
  Artist,
  ArtistPersistenceData,
} from "../../../domain/artists/entities";
import { reconstructArtist } from "../../../domain/artists/factories";
import { createAccountIdAlreadyTakenError } from "../../../domain/artists/errors";
import type { TransactionContext } from "../../transaction";

const POSTGRES_UNIQUE_VIOLATION = "23505";

const isUniqueViolation = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === POSTGRES_UNIQUE_VIOLATION
  );
};

export const createArtistRepository = (
  db: DatabaseClient
): IArtistRepository => ({
  async save(
    data: ArtistPersistenceData,
    tx?: TransactionContext
  ): Promise<Artist> {
    const executor = tx ?? db;
    try {
      const [result] = await executor
        .insert(artistsTable)
        .values({ id: data.id, accountId: data.accountId })
        .returning({
          id: artistsTable.id,
          accountId: artistsTable.accountId,
        });

      return reconstructArtist({
        artistId: result.id,
        accountId: result.accountId,
        profile: null,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw createAccountIdAlreadyTakenError(data.accountId);
      }
      throw error;
    }
  },

  async findByUserId(userId: string) {
    const results = await db
      .select({
        artistId: artistsTable.id,
        accountId: artistsTable.accountId,
        profileName: artistProfilesTable.name,
      })
      .from(artistOwnersTable)
      .innerJoin(artistsTable, eq(artistOwnersTable.artistId, artistsTable.id))
      .leftJoin(
        artistProfilesTable,
        eq(artistsTable.id, artistProfilesTable.artistId)
      )
      .where(eq(artistOwnersTable.userId, userId))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return reconstructArtist({
      artistId: row.artistId,
      accountId: row.accountId,
      profile: row.profileName ? { name: row.profileName } : null,
    });
  },
});
