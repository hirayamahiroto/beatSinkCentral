import { eq } from "drizzle-orm";
import {
  DatabaseClient,
  artistsTable,
  artistOwnersTable,
  artistProfilesTable,
} from "../../../../../../packages/database/src/utils/createClient";
import type {
  IArtistRepository,
  ArtistUpdateAccountIdData,
} from "../../../domain/artists/repositories";
import type {
  Artist,
  ArtistPersistenceData,
} from "../../../domain/artists/entities";
import { reconstructArtist } from "../../../domain/artists/factories";
import type { TransactionContext } from "../../transaction";

export const createArtistRepository = (
  db: DatabaseClient,
): IArtistRepository => ({
  async save(
    data: ArtistPersistenceData,
    tx?: TransactionContext,
  ): Promise<Artist> {
    const executor = tx ?? db;
    const [artistRow] = await executor
      .insert(artistsTable)
      .values({ id: data.id, accountId: data.accountId })
      .returning({
        id: artistsTable.id,
        accountId: artistsTable.accountId,
      });

    await executor.insert(artistOwnersTable).values({
      userId: data.ownerUserId,
      artistId: artistRow.id,
    });

    return reconstructArtist({
      artistId: artistRow.id,
      accountId: artistRow.accountId,
      ownerUserId: data.ownerUserId,
      profile: null,
    });
  },

  async findByUserId(userId: string) {
    const results = await db
      .select({
        artistId: artistsTable.id,
        accountId: artistsTable.accountId,
        ownerUserId: artistOwnersTable.userId,
        profileName: artistProfilesTable.name,
      })
      .from(artistOwnersTable)
      .innerJoin(artistsTable, eq(artistOwnersTable.artistId, artistsTable.id))
      .leftJoin(
        artistProfilesTable,
        eq(artistsTable.id, artistProfilesTable.artistId),
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
      ownerUserId: row.ownerUserId,
      profile: row.profileName ? { name: row.profileName } : null,
    });
  },

  async findByAccountId(accountId: string, tx?: TransactionContext) {
    const executor = tx ?? db;
    const results = await executor
      .select({
        artistId: artistsTable.id,
        accountId: artistsTable.accountId,
        ownerUserId: artistOwnersTable.userId,
        profileName: artistProfilesTable.name,
      })
      .from(artistsTable)
      .innerJoin(
        artistOwnersTable,
        eq(artistsTable.id, artistOwnersTable.artistId),
      )
      .leftJoin(
        artistProfilesTable,
        eq(artistsTable.id, artistProfilesTable.artistId),
      )
      .where(eq(artistsTable.accountId, accountId))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return reconstructArtist({
      artistId: row.artistId,
      accountId: row.accountId,
      ownerUserId: row.ownerUserId,
      profile: row.profileName ? { name: row.profileName } : null,
    });
  },

  async updateAccountId(
    data: ArtistUpdateAccountIdData,
    tx?: TransactionContext,
  ): Promise<Artist> {
    const executor = tx ?? db;
    const [artistRow] = await executor
      .update(artistsTable)
      .set({ accountId: data.accountId })
      .where(eq(artistsTable.id, data.artistId))
      .returning({
        id: artistsTable.id,
        accountId: artistsTable.accountId,
      });

    const [ownerRow] = await executor
      .select({ userId: artistOwnersTable.userId })
      .from(artistOwnersTable)
      .where(eq(artistOwnersTable.artistId, artistRow.id))
      .limit(1);

    const [profileRow] = await executor
      .select({ name: artistProfilesTable.name })
      .from(artistProfilesTable)
      .where(eq(artistProfilesTable.artistId, artistRow.id))
      .limit(1);

    return reconstructArtist({
      artistId: artistRow.id,
      accountId: artistRow.accountId,
      ownerUserId: ownerRow.userId,
      profile: profileRow ? { name: profileRow.name } : null,
    });
  },
});
