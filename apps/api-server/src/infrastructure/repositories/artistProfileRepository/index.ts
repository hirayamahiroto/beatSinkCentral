import { and, eq, isNull, asc } from "drizzle-orm";
import {
  DatabaseClient,
  artistsTable,
  artistProfilesTable,
  artistProfileGenresTable,
  artistProfileSnsLinksTable,
} from "../../../../../../packages/database/src/utils/createClient";
import type {
  IArtistProfileRepository,
  ArtistProfileSaveData,
  ArtistProfileSetPublishedData,
} from "../../../domain/artistProfiles/repositories";
import type { ArtistProfile } from "../../../domain/artistProfiles/entities";
import { reconstructArtistProfile } from "../../../domain/artistProfiles/factories";
import { createArtistProfileNotFoundError } from "../../../domain/artistProfiles/policies/assertArtistProfileExists";
import type { TransactionContext } from "../../transaction";

type Executor = DatabaseClient | TransactionContext;

type ProfileRow = {
  id: string;
  artistId: string;
  name: string | null;
  tagline: string | null;
  imageUrl: string | null;
  story: string | null;
  activityInfo: string | null;
  published: boolean;
};

const profileColumns = {
  id: artistProfilesTable.id,
  artistId: artistProfilesTable.artistId,
  name: artistProfilesTable.name,
  tagline: artistProfilesTable.tagline,
  imageUrl: artistProfilesTable.imageUrl,
  story: artistProfilesTable.story,
  activityInfo: artistProfilesTable.activityInfo,
  published: artistProfilesTable.published,
};

const loadChildren = async (executor: Executor, profileId: string) => {
  const [genreRows, snsRows] = await Promise.all([
    executor
      .select({ genre: artistProfileGenresTable.genre })
      .from(artistProfileGenresTable)
      .where(eq(artistProfileGenresTable.artistProfileId, profileId))
      .orderBy(asc(artistProfileGenresTable.sortOrder)),
    executor
      .select({ url: artistProfileSnsLinksTable.url })
      .from(artistProfileSnsLinksTable)
      .where(eq(artistProfileSnsLinksTable.artistProfileId, profileId))
      .orderBy(asc(artistProfileSnsLinksTable.sortOrder)),
  ]);
  return {
    genres: genreRows.map((row) => row.genre),
    snsLinks: snsRows.map((row) => row.url),
  };
};

const toEntity = (
  row: ProfileRow,
  genres: string[],
  snsLinks: string[],
): ArtistProfile =>
  reconstructArtistProfile({
    id: row.id,
    artistId: row.artistId,
    published: row.published,
    name: row.name,
    tagline: row.tagline,
    imageUrl: row.imageUrl,
    story: row.story,
    activityInfo: row.activityInfo,
    genres,
    snsLinks,
  });

const replaceChildren = async (
  executor: Executor,
  profileId: string,
  genres: string[],
  snsLinks: string[],
) => {
  await Promise.all([
    executor
      .delete(artistProfileGenresTable)
      .where(eq(artistProfileGenresTable.artistProfileId, profileId)),
    executor
      .delete(artistProfileSnsLinksTable)
      .where(eq(artistProfileSnsLinksTable.artistProfileId, profileId)),
  ]);

  if (genres.length > 0) {
    await executor.insert(artistProfileGenresTable).values(
      genres.map((genre, index) => ({
        artistProfileId: profileId,
        genre,
        sortOrder: index,
      })),
    );
  }
  if (snsLinks.length > 0) {
    await executor.insert(artistProfileSnsLinksTable).values(
      snsLinks.map((url, index) => ({
        artistProfileId: profileId,
        url,
        sortOrder: index,
      })),
    );
  }
};

export const createArtistProfileRepository = (
  db: DatabaseClient,
): IArtistProfileRepository => ({
  async findByArtistId(
    artistId: string,
    tx?: TransactionContext,
  ): Promise<ArtistProfile | null> {
    const executor = tx ?? db;
    const [row] = await executor
      .select(profileColumns)
      .from(artistProfilesTable)
      .where(
        and(
          eq(artistProfilesTable.artistId, artistId),
          isNull(artistProfilesTable.deletedAt),
        ),
      )
      .limit(1);
    if (!row) return null;

    const { genres, snsLinks } = await loadChildren(executor, row.id);
    return toEntity(row, genres, snsLinks);
  },

  async findPublishedByAccountId(
    accountId: string,
  ): Promise<ArtistProfile | null> {
    const [row] = await db
      .select(profileColumns)
      .from(artistProfilesTable)
      .innerJoin(artistsTable, eq(artistProfilesTable.artistId, artistsTable.id))
      .where(
        and(
          eq(artistsTable.accountId, accountId),
          eq(artistProfilesTable.published, true),
          isNull(artistProfilesTable.deletedAt),
        ),
      )
      .limit(1);
    if (!row) return null;

    const { genres, snsLinks } = await loadChildren(db, row.id);
    return toEntity(row, genres, snsLinks);
  },

  async upsert(
    data: ArtistProfileSaveData,
    tx?: TransactionContext,
  ): Promise<ArtistProfile> {
    const executor = tx ?? db;
    const [row] = await executor
      .insert(artistProfilesTable)
      .values({
        id: data.id,
        artistId: data.artistId,
        name: data.name,
        tagline: data.tagline,
        imageUrl: data.imageUrl,
        story: data.story,
        activityInfo: data.activityInfo,
        published: data.published,
      })
      .onConflictDoUpdate({
        target: artistProfilesTable.artistId,
        set: {
          name: data.name,
          tagline: data.tagline,
          imageUrl: data.imageUrl,
          story: data.story,
          activityInfo: data.activityInfo,
          updatedAt: new Date(),
        },
      })
      .returning(profileColumns);

    await replaceChildren(executor, row.id, data.genres, data.snsLinks);
    return toEntity(row, data.genres, data.snsLinks);
  },

  async setPublished(
    data: ArtistProfileSetPublishedData,
    tx?: TransactionContext,
  ): Promise<ArtistProfile> {
    const executor = tx ?? db;
    const [row] = await executor
      .update(artistProfilesTable)
      .set({
        published: data.published,
        publishedAt: data.published ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(artistProfilesTable.artistId, data.artistId),
          isNull(artistProfilesTable.deletedAt),
        ),
      )
      .returning(profileColumns);
    if (!row) throw createArtistProfileNotFoundError();

    const { genres, snsLinks } = await loadChildren(executor, row.id);
    return toEntity(row, genres, snsLinks);
  },
});
