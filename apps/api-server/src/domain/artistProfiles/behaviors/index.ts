import type {
  ArtistProfile,
  ArtistProfileState,
  ArtistProfilePersistenceData,
  ArtistProfileView,
  StoryChapterData,
} from "../entities";
import type { StoryChapter } from "../valueObjects/storyChapter";
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

export const createArtistProfileBehaviors = (
  state: ArtistProfileState,
): ArtistProfile => {
  const toLinks = () =>
    state.links.map((link) => ({
      type: link.type,
      url: link.url,
      label: link.label,
    }));

  const toContent = (): ArtistProfileView => ({
    name: valueOrNull(state.name),
    tagline: valueOrNull(state.tagline),
    imageUrl: valueOrNull(state.imageUrl),
    chapters: toOrderedChapters(state.chapters),
    activityInfo: valueOrNull(state.activityInfo),
    genres: state.genres.map((genre) => genre.value),
    links: toLinks(),
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
    isPublished: () => state.published,
    publish: () => createArtistProfileBehaviors({ ...state, published: true }),
    unpublish: () =>
      createArtistProfileBehaviors({ ...state, published: false }),
    toPersistence: (): ArtistProfilePersistenceData => ({
      id: state.id,
      artistId: state.artistId,
      ...toContent(),
    }),
    toView: toContent,
  };
};
