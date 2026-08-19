import { and, eq, isNull, isNotNull, asc, desc, inArray } from "drizzle-orm";
import {
  artistsTable,
  artistProfilesTable,
  artistProfileGenresTable,
  artistProfileLinksTable,
  linkTypesTable,
} from "../../../../../../packages/database/src/utils/createClient";
import type {
  IArtistProfileReader,
  IArtistProfileWriter,
  ArtistProfileSaveData,
  ArtistProfileSetPublishedData,
  ListPublishedSummariesInput,
  PublishedProfileSummary,
} from "../../../domain/artistProfiles/repositories";
import type {
  ArtistProfile,
  ProfileLinkData,
} from "../../../domain/artistProfiles/entities";
import { reconstructArtistProfile } from "../../../domain/artistProfiles/factories";
import { createArtistProfileNotFoundError } from "../../../domain/artistProfiles/errors/artistProfileNotFound";
import { createInvalidProfileLinkFormatError } from "../../../domain/artistProfiles/valueObjects/profileLink";
import type { Executor } from "../../transaction";

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

// Drizzle の isNotNull は取得行の型を絞らないため、null を落として契約の name: string を満たす
const toPublishedSummaries = (
  rows: {
    accountId: string;
    name: string | null;
    imageUrl: string | null;
  }[],
): PublishedProfileSummary[] =>
  rows.flatMap((row) =>
    row.name === null ? [] : [{ ...row, name: row.name }],
  );

const loadChildren = async (executor: Executor, profileId: string) => {
  const [genreRows, linkRows] = await Promise.all([
    executor
      .select({ genre: artistProfileGenresTable.genre })
      .from(artistProfileGenresTable)
      .where(eq(artistProfileGenresTable.artistProfileId, profileId))
      .orderBy(asc(artistProfileGenresTable.sortOrder)),
    executor
      .select({
        type: linkTypesTable.code,
        url: artistProfileLinksTable.url,
        label: artistProfileLinksTable.label,
      })
      .from(artistProfileLinksTable)
      .innerJoin(
        linkTypesTable,
        eq(artistProfileLinksTable.linkTypeId, linkTypesTable.id),
      )
      .where(eq(artistProfileLinksTable.artistProfileId, profileId))
      .orderBy(asc(artistProfileLinksTable.sortOrder)),
  ]);
  return {
    genres: genreRows.map((row) => row.genre),
    links: linkRows,
  };
};

const toEntity = (
  row: ProfileRow,
  genres: string[],
  links: ProfileLinkData[],
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
    links,
  });

const resolveLinkTypeIds = async (
  executor: Executor,
  links: ProfileLinkData[],
): Promise<Map<string, number>> => {
  const codes = [...new Set(links.map((link) => link.type))];
  const rows = await executor
    .select({ id: linkTypesTable.id, code: linkTypesTable.code })
    .from(linkTypesTable)
    .where(inArray(linkTypesTable.code, codes));
  return new Map(rows.map((row) => [row.code, row.id]));
};

const replaceChildren = async (
  executor: Executor,
  profileId: string,
  genres: string[],
  links: ProfileLinkData[],
) => {
  await Promise.all([
    executor
      .delete(artistProfileGenresTable)
      .where(eq(artistProfileGenresTable.artistProfileId, profileId)),
    executor
      .delete(artistProfileLinksTable)
      .where(eq(artistProfileLinksTable.artistProfileId, profileId)),
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

  if (links.length > 0) {
    const idByCode = await resolveLinkTypeIds(executor, links);
    await executor.insert(artistProfileLinksTable).values(
      links.map((link, index) => {
        const linkTypeId = idByCode.get(link.type);
        if (linkTypeId === undefined) {
          throw createInvalidProfileLinkFormatError();
        }
        return {
          artistProfileId: profileId,
          linkTypeId,
          url: link.url,
          label: link.label,
          sortOrder: index,
        };
      }),
    );
  }
};

export const createArtistProfileReader = (
  executor: Executor,
): IArtistProfileReader => ({
  async findByArtistId(artistId: string): Promise<ArtistProfile | null> {
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

    const { genres, links } = await loadChildren(executor, row.id);
    return toEntity(row, genres, links);
  },

  async findPublishedByAccountId(
    accountId: string,
  ): Promise<ArtistProfile | null> {
    const [row] = await executor
      .select(profileColumns)
      .from(artistProfilesTable)
      .innerJoin(
        artistsTable,
        eq(artistProfilesTable.artistId, artistsTable.id),
      )
      .where(
        and(
          eq(artistsTable.accountId, accountId),
          eq(artistProfilesTable.published, true),
          isNull(artistProfilesTable.deletedAt),
        ),
      )
      .limit(1);
    if (!row) return null;

    const { genres, links } = await loadChildren(executor, row.id);
    return toEntity(row, genres, links);
  },

  async listPublishedSummaries({
    limit,
  }: ListPublishedSummariesInput): Promise<PublishedProfileSummary[]> {
    const rows = await executor
      .select({
        accountId: artistsTable.accountId,
        name: artistProfilesTable.name,
        imageUrl: artistProfilesTable.imageUrl,
      })
      .from(artistProfilesTable)
      .innerJoin(
        artistsTable,
        eq(artistProfilesTable.artistId, artistsTable.id),
      )
      .where(
        and(
          eq(artistProfilesTable.published, true),
          isNull(artistProfilesTable.deletedAt),
          isNotNull(artistProfilesTable.name),
        ),
      )
      .orderBy(
        desc(artistProfilesTable.publishedAt),
        asc(artistsTable.accountId),
      )
      .limit(limit);

    return toPublishedSummaries(rows);
  },
});

export const createArtistProfileWriter = (
  executor: Executor,
): IArtistProfileWriter => ({
  async upsert(data: ArtistProfileSaveData): Promise<ArtistProfile> {
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

    await replaceChildren(executor, row.id, data.genres, data.links);
    return toEntity(row, data.genres, data.links);
  },

  async setPublished(
    data: ArtistProfileSetPublishedData,
  ): Promise<ArtistProfile> {
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

    const { genres, links } = await loadChildren(executor, row.id);
    return toEntity(row, genres, links);
  },
});
