import type {
  ArtistProfile,
  ArtistProfileAttributes,
  ArtistProfileState,
  ArtistProfilePersistenceData,
  ArtistProfileView,
  ProfileLinkData,
  StoryChapterData,
} from "../entities";
import type { ImageUrl } from "../valueObjects/imageUrl";
import type { ProfileLink } from "../valueObjects/profileLink";
import type { PresentationPatternCode } from "../valueObjects/presentationPattern";
import type {
  StoryChapter,
  StoryQuestionCode,
} from "../valueObjects/storyChapter";
import { STORY_QUESTION_CODES } from "../valueObjects/storyChapter";

const valueOrNull = (vo: { readonly value: string } | null): string | null =>
  vo === null ? null : vo.value;

const toOrderedChapters = (
  chapters: readonly StoryChapter[],
): StoryChapterData[] =>
  STORY_QUESTION_CODES.flatMap((code) => {
    const chapter = chapters.find((entry) => entry.questionCode === code);
    return chapter
      ? [{ questionCode: chapter.questionCode, body: chapter.body }]
      : [];
  });

const withoutChapter = (
  chapters: readonly StoryChapter[],
  questionCode: StoryQuestionCode,
): StoryChapter[] =>
  chapters.filter((chapter) => chapter.questionCode !== questionCode);

export const createArtistProfileBehaviors = (
  state: ArtistProfileState,
): ArtistProfile => {
  const toLinks = (): ProfileLinkData[] =>
    state.links.map((link) => ({
      linkTypeCode: link.linkTypeCode,
      url: link.url,
    }));

  const toView = (): ArtistProfileView => ({
    attributes: {
      name: valueOrNull(state.name),
      imageUrl: valueOrNull(state.imageUrl),
      tagline: valueOrNull(state.tagline),
      genres: state.genres.map((genre) => genre.value),
      activityInfo: valueOrNull(state.activityInfo),
    },
    story: {
      chapters: toOrderedChapters(state.chapters).map((chapter) => ({
        key: chapter.questionCode,
        body: chapter.body,
      })),
    },
    links: toLinks(),
    presentation: { patternCode: state.presentationPattern },
    published: state.published,
  });

  return {
    getId: () => state.id,
    getArtistId: () => state.artistId,
    getName: () => valueOrNull(state.name),
    getTagline: () => valueOrNull(state.tagline),
    getImageUrl: () => valueOrNull(state.imageUrl),
    getChapters: () => toOrderedChapters(state.chapters),
    getActivityInfo: () => valueOrNull(state.activityInfo),
    getGenres: () => state.genres.map((genre) => genre.value),
    getLinks: toLinks,
    getPresentationPatternCode: () => state.presentationPattern,
    isPublished: () => state.published,
    publish: () => createArtistProfileBehaviors({ ...state, published: true }),
    unpublish: () =>
      createArtistProfileBehaviors({ ...state, published: false }),
    reviseAttributes: (attributes: ArtistProfileAttributes) =>
      createArtistProfileBehaviors({ ...state, ...attributes }),
    writeStoryChapter: (chapter: StoryChapter) =>
      createArtistProfileBehaviors({
        ...state,
        chapters: [
          ...withoutChapter(state.chapters, chapter.questionCode),
          chapter,
        ],
      }),
    clearStoryChapter: (questionCode: StoryQuestionCode) =>
      createArtistProfileBehaviors({
        ...state,
        chapters: withoutChapter(state.chapters, questionCode),
      }),
    replaceLinks: (links: readonly ProfileLink[]) =>
      createArtistProfileBehaviors({ ...state, links }),
    choosePresentationPattern: (pattern: PresentationPatternCode) =>
      createArtistProfileBehaviors({ ...state, presentationPattern: pattern }),
    changeImage: (imageUrl: ImageUrl) =>
      createArtistProfileBehaviors({ ...state, imageUrl }),
    toPersistence: (): ArtistProfilePersistenceData => ({
      id: state.id,
      artistId: state.artistId,
      name: valueOrNull(state.name),
      tagline: valueOrNull(state.tagline),
      imageUrl: valueOrNull(state.imageUrl),
      chapters: toOrderedChapters(state.chapters),
      activityInfo: valueOrNull(state.activityInfo),
      genres: state.genres.map((genre) => genre.value),
      links: toLinks(),
      presentationPatternCode: state.presentationPattern,
      published: state.published,
    }),
    toView,
  };
};
