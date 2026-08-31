import { eq } from "drizzle-orm";
import {
  artistsTable,
  artistOwnersTable,
  artistProfilesTable,
} from "../../../../../../packages/database/src/utils/createClient";
import type {
  IArtistReader,
  IArtistWriter,
  ArtistUpdateHandleData,
} from "../../../domain/artists/repositories";
import type {
  Artist,
  ArtistPersistenceData,
} from "../../../domain/artists/entities";
import { reconstructArtist } from "../../../domain/artists/factories";
import { createArtistNotFoundError } from "../../../domain/artists/errors/artistNotFound";
import { createHandleAlreadyTakenError } from "../../../domain/artists/errors/handleAlreadyTaken";
import { isUniqueViolation } from "../../database/uniqueViolation";
import type { Executor } from "../../transaction";

const HANDLE_UNIQUE_CONSTRAINT = "artists_handle_unique";

const artistColumns = {
  artistId: artistsTable.id,
  handle: artistsTable.handle,
  ownerUserId: artistOwnersTable.userId,
  profileName: artistProfilesTable.name,
};

const rejectTakenHandle = async <T>(
  handle: string,
  write: () => Promise<T>,
): Promise<T> => {
  try {
    return await write();
  } catch (error) {
    if (isUniqueViolation(error, HANDLE_UNIQUE_CONSTRAINT)) {
      throw createHandleAlreadyTakenError(handle);
    }
    throw error;
  }
};

export const createArtistReader = (executor: Executor): IArtistReader => ({
  async findByUserId(userId: string) {
    const results = await executor
      .select(artistColumns)
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
      handle: row.handle,
      ownerUserId: row.ownerUserId,
      profile: row.profileName ? { name: row.profileName } : null,
    });
  },

  async findByHandle(handle: string) {
    const results = await executor
      .select(artistColumns)
      .from(artistsTable)
      .innerJoin(
        artistOwnersTable,
        eq(artistsTable.id, artistOwnersTable.artistId),
      )
      .leftJoin(
        artistProfilesTable,
        eq(artistsTable.id, artistProfilesTable.artistId),
      )
      .where(eq(artistsTable.handle, handle))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return reconstructArtist({
      artistId: row.artistId,
      handle: row.handle,
      ownerUserId: row.ownerUserId,
      profile: row.profileName ? { name: row.profileName } : null,
    });
  },
});

export const createArtistWriter = (executor: Executor): IArtistWriter => ({
  async save(data: ArtistPersistenceData): Promise<Artist> {
    const [artistRow] = await rejectTakenHandle(data.handle, () =>
      executor
        .insert(artistsTable)
        .values({ id: data.id, handle: data.handle })
        .returning({
          id: artistsTable.id,
          handle: artistsTable.handle,
        }),
    );

    await executor.insert(artistOwnersTable).values({
      userId: data.ownerUserId,
      artistId: artistRow.id,
    });

    return reconstructArtist({
      artistId: artistRow.id,
      handle: artistRow.handle,
      ownerUserId: data.ownerUserId,
      profile: null,
    });
  },

  async updateHandle(data: ArtistUpdateHandleData): Promise<Artist> {
    const [artistRow] = await rejectTakenHandle(data.handle, () =>
      executor
        .update(artistsTable)
        .set({ handle: data.handle })
        .where(eq(artistsTable.id, data.artistId))
        .returning({
          id: artistsTable.id,
          handle: artistsTable.handle,
        }),
    );
    if (!artistRow) throw createArtistNotFoundError();

    const [ownerRow] = await executor
      .select({ userId: artistOwnersTable.userId })
      .from(artistOwnersTable)
      .where(eq(artistOwnersTable.artistId, artistRow.id))
      .limit(1);
    if (!ownerRow) throw createArtistNotFoundError();

    const [profileRow] = await executor
      .select({ name: artistProfilesTable.name })
      .from(artistProfilesTable)
      .where(eq(artistProfilesTable.artistId, artistRow.id))
      .limit(1);

    return reconstructArtist({
      artistId: artistRow.id,
      handle: artistRow.handle,
      ownerUserId: ownerRow.userId,
      // name は下書き許容で nullable 化したため、name 有無で profile 有無を判定する
      // （findByUserId / findByHandle と同じ扱い。プロフィール本体は artistProfiles 集約が担う）。
      profile: profileRow?.name ? { name: profileRow.name } : null,
    });
  },
});
