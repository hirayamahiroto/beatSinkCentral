import { eq } from "drizzle-orm";
import {
  DatabaseClient,
  artistsTable,
  artistOwnersTable,
  artistProfilesTable,
} from "../../../../../../packages/database/src/utils/createClient";
import type { IArtistRepository } from "../../../domain/artists/repositories";
import { reconstructArtist } from "../../../domain/artists/factories";

export const createArtistRepository = (
  db: DatabaseClient
): IArtistRepository => ({
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
