import {
  and,
  eq,
  isNull,
  isNotNull,
  asc,
  desc,
  inArray,
  sql,
} from "drizzle-orm";
import {
  artistsTable,
  artistProfilesTable,
  artistProfileGenresTable,
  artistProfileLinksTable,
  linkTypesTable,
  presentationPatternsTable,
  storyChaptersTable,
  storyQuestionsTable,
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
  StoryChapterData,
} from "../../../domain/artistProfiles/entities";
import { reconstructArtistProfile } from "../../../domain/artistProfiles/factories";
import { createArtistProfileNotFoundError } from "../../../domain/artistProfiles/errors/artistProfileNotFound";
import { createInvalidProfileLinkFormatError } from "../../../domain/artistProfiles/valueObjects/profileLink";
import { createInvalidStoryChapterFormatError } from "../../../domain/artistProfiles/valueObjects/storyChapter";
import { createInvalidPresentationPatternError } from "../../../domain/artistProfiles/valueObjects/presentationPattern";
import type { Executor } from "../../transaction";

type ProfileRow = {
  id: string;
  artistId: string;
  name: string | null;
  tagline: string | null;
  imageUrl: string | null;
  activityInfo: string | null;
  presentationPatternCode: string | null;
  published: boolean;
};

const profileColumns = {
  id: artistProfilesTable.id,
  artistId: artistProfilesTable.artistId,
  name: artistProfilesTable.name,
  tagline: artistProfilesTable.tagline,
  imageUrl: artistProfilesTable.imageUrl,
  activityInfo: artistProfilesTable.activityInfo,
  presentationPatternCode: presentationPatternsTable.code,
  published: artistProfilesTable.published,
};

const writtenProfileColumns = {
  id: artistProfilesTable.id,
  artistId: artistProfilesTable.artistId,
  name: artistProfilesTable.name,
  tagline: artistProfilesTable.tagline,
  imageUrl: artistProfilesTable.imageUrl,
  activityInfo: artistProfilesTable.activityInfo,
  published: artistProfilesTable.published,
};

const presentationPatternJoin = [
  presentationPatternsTable,
  eq(artistProfilesTable.presentationPatternId, presentationPatternsTable.id),
] as const;

// Drizzle の isNotNull は取得行の型を絞らないため、null を落として契約の name: string を満たす
const toPublishedSummaries = (
  rows: {
    handle: string;
    name: string | null;
    imageUrl: string | null;
    tagline: string | null;
    genres: string[];
  }[],
): PublishedProfileSummary[] =>
  rows.flatMap((row) =>
    row.name === null ? [] : [{ ...row, name: row.name }],
  );

const loadChildren = async (executor: Executor, profileId: string) => {
  const [genreRows, linkRows, chapterRows] = await Promise.all([
    executor
      .select({ genre: artistProfileGenresTable.genre })
      .from(artistProfileGenresTable)
      .where(eq(artistProfileGenresTable.artistProfileId, profileId))
      .orderBy(asc(artistProfileGenresTable.sortOrder)),
    executor
      .select({
        linkTypeCode: linkTypesTable.code,
        url: artistProfileLinksTable.url,
      })
      .from(artistProfileLinksTable)
      .innerJoin(
        linkTypesTable,
        eq(artistProfileLinksTable.linkTypeId, linkTypesTable.id),
      )
      .where(eq(artistProfileLinksTable.artistProfileId, profileId))
      .orderBy(asc(artistProfileLinksTable.sortOrder)),
    executor
      .select({
        questionCode: storyQuestionsTable.code,
        body: storyChaptersTable.body,
      })
      .from(storyChaptersTable)
      .innerJoin(
        storyQuestionsTable,
        eq(storyChaptersTable.storyQuestionId, storyQuestionsTable.id),
      )
      .where(eq(storyChaptersTable.artistProfileId, profileId))
      .orderBy(asc(storyQuestionsTable.sortOrder)),
  ]);
  return {
    genres: genreRows.map((row) => row.genre),
    links: linkRows,
    chapters: chapterRows,
  };
};

const loadPresentationPatternCode = async (
  executor: Executor,
  profileId: string,
): Promise<string | null> => {
  const [row] = await executor
    .select({ code: presentationPatternsTable.code })
    .from(artistProfilesTable)
    .innerJoin(...presentationPatternJoin)
    .where(eq(artistProfilesTable.id, profileId))
    .limit(1);
  return row ? row.code : null;
};

const toEntity = (
  row: ProfileRow,
  genres: string[],
  links: ProfileLinkData[],
  chapters: StoryChapterData[],
): ArtistProfile =>
  reconstructArtistProfile({
    id: row.id,
    artistId: row.artistId,
    published: row.published,
    name: row.name,
    tagline: row.tagline,
    imageUrl: row.imageUrl,
    chapters,
    activityInfo: row.activityInfo,
    genres,
    links,
    presentationPatternCode: row.presentationPatternCode,
  });

const resolveLinkTypeIds = async (
  executor: Executor,
  links: ProfileLinkData[],
): Promise<Map<string, number>> => {
  const codes = [...new Set(links.map((link) => link.linkTypeCode))];
  const rows = await executor
    .select({ id: linkTypesTable.id, code: linkTypesTable.code })
    .from(linkTypesTable)
    .where(inArray(linkTypesTable.code, codes));
  return new Map(rows.map((row) => [row.code, row.id]));
};

const resolvePresentationPatternId = async (
  executor: Executor,
  code: string | null,
): Promise<number | null> => {
  if (code === null) return null;
  const [row] = await executor
    .select({ id: presentationPatternsTable.id })
    .from(presentationPatternsTable)
    .where(eq(presentationPatternsTable.code, code))
    .limit(1);
  if (!row) throw createInvalidPresentationPatternError();
  return row.id;
};

const resolveStoryQuestionIds = async (
  executor: Executor,
  chapters: StoryChapterData[],
): Promise<Map<string, number>> => {
  const codes = [...new Set(chapters.map((chapter) => chapter.questionCode))];
  const rows = await executor
    .select({ id: storyQuestionsTable.id, code: storyQuestionsTable.code })
    .from(storyQuestionsTable)
    .where(inArray(storyQuestionsTable.code, codes));
  return new Map(rows.map((row) => [row.code, row.id]));
};

const replaceChildren = async (
  executor: Executor,
  profileId: string,
  genres: string[],
  links: ProfileLinkData[],
  chapters: StoryChapterData[],
) => {
  await Promise.all([
    executor
      .delete(artistProfileGenresTable)
      .where(eq(artistProfileGenresTable.artistProfileId, profileId)),
    executor
      .delete(artistProfileLinksTable)
      .where(eq(artistProfileLinksTable.artistProfileId, profileId)),
    executor
      .delete(storyChaptersTable)
      .where(eq(storyChaptersTable.artistProfileId, profileId)),
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
        const linkTypeId = idByCode.get(link.linkTypeCode);
        if (linkTypeId === undefined) {
          throw createInvalidProfileLinkFormatError();
        }
        return {
          artistProfileId: profileId,
          linkTypeId,
          url: link.url,
          sortOrder: index,
        };
      }),
    );
  }

  if (chapters.length > 0) {
    const idByCode = await resolveStoryQuestionIds(executor, chapters);
    await executor.insert(storyChaptersTable).values(
      chapters.map((chapter) => {
        const storyQuestionId = idByCode.get(chapter.questionCode);
        if (storyQuestionId === undefined) {
          throw createInvalidStoryChapterFormatError();
        }
        return {
          artistProfileId: profileId,
          storyQuestionId,
          body: chapter.body,
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
      .leftJoin(...presentationPatternJoin)
      .where(
        and(
          eq(artistProfilesTable.artistId, artistId),
          isNull(artistProfilesTable.deletedAt),
        ),
      )
      .limit(1);
    if (!row) return null;

    const { genres, links, chapters } = await loadChildren(executor, row.id);
    return toEntity(row, genres, links, chapters);
  },

  async findPublishedByHandle(handle: string): Promise<ArtistProfile | null> {
    const [row] = await executor
      .select(profileColumns)
      .from(artistProfilesTable)
      .innerJoin(
        artistsTable,
        eq(artistProfilesTable.artistId, artistsTable.id),
      )
      .leftJoin(...presentationPatternJoin)
      .where(
        and(
          eq(artistsTable.handle, handle),
          eq(artistProfilesTable.published, true),
          isNull(artistProfilesTable.deletedAt),
        ),
      )
      .limit(1);
    if (!row) return null;

    const { genres, links, chapters } = await loadChildren(executor, row.id);
    return toEntity(row, genres, links, chapters);
  },

  async listPublishedSummaries({
    limit,
  }: ListPublishedSummariesInput): Promise<PublishedProfileSummary[]> {
    const genresByProfile = executor
      .select({
        artistProfileId: artistProfileGenresTable.artistProfileId,
        genres: sql<
          string[]
        >`array_agg(${artistProfileGenresTable.genre} order by ${artistProfileGenresTable.sortOrder})`.as(
          "genres",
        ),
      })
      .from(artistProfileGenresTable)
      .groupBy(artistProfileGenresTable.artistProfileId)
      .as("profile_genres");

    const rows = await executor
      .select({
        handle: artistsTable.handle,
        name: artistProfilesTable.name,
        imageUrl: artistProfilesTable.imageUrl,
        tagline: artistProfilesTable.tagline,
        genres: sql<string[]>`coalesce(${genresByProfile.genres}, '{}')`,
      })
      .from(artistProfilesTable)
      .innerJoin(
        artistsTable,
        eq(artistProfilesTable.artistId, artistsTable.id),
      )
      .leftJoin(
        genresByProfile,
        eq(genresByProfile.artistProfileId, artistProfilesTable.id),
      )
      .where(
        and(
          eq(artistProfilesTable.published, true),
          isNull(artistProfilesTable.deletedAt),
          isNotNull(artistProfilesTable.name),
        ),
      )
      .orderBy(desc(artistProfilesTable.publishedAt), asc(artistsTable.handle))
      .limit(limit);

    return toPublishedSummaries(rows);
  },
});

export const createArtistProfileWriter = (
  executor: Executor,
): IArtistProfileWriter => ({
  async upsert(data: ArtistProfileSaveData): Promise<ArtistProfile> {
    const presentationPatternId = await resolvePresentationPatternId(
      executor,
      data.presentationPatternCode,
    );
    const [row] = await executor
      .insert(artistProfilesTable)
      .values({
        id: data.id,
        artistId: data.artistId,
        name: data.name,
        tagline: data.tagline,
        imageUrl: data.imageUrl,
        activityInfo: data.activityInfo,
        presentationPatternId,
        published: data.published,
      })
      .onConflictDoUpdate({
        target: artistProfilesTable.artistId,
        set: {
          name: data.name,
          tagline: data.tagline,
          imageUrl: data.imageUrl,
          activityInfo: data.activityInfo,
          presentationPatternId,
          published: sql`${artistProfilesTable.published} and excluded.published`,
          publishedAt: sql`case when excluded.published then ${artistProfilesTable.publishedAt} else null end`,
          updatedAt: new Date(),
        },
      })
      .returning(writtenProfileColumns);

    await replaceChildren(
      executor,
      row.id,
      data.genres,
      data.links,
      data.chapters,
    );
    return toEntity(
      { ...row, presentationPatternCode: data.presentationPatternCode },
      data.genres,
      data.links,
      data.chapters,
    );
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
      .returning(writtenProfileColumns);
    if (!row) throw createArtistProfileNotFoundError();

    const [{ genres, links, chapters }, presentationPatternCode] =
      await Promise.all([
        loadChildren(executor, row.id),
        loadPresentationPatternCode(executor, row.id),
      ]);
    return toEntity(
      { ...row, presentationPatternCode },
      genres,
      links,
      chapters,
    );
  },
});
