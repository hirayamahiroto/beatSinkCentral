import type {
  ArtistProfileAttributes,
  ArtistProfilePersistenceData,
  ArtistProfileView,
  DraftProfile,
  ProfileContent,
  ProfileLinkData,
  ProfileState,
  PublishedProfile,
  StoredProfile,
  StoryChapterData,
} from "../entities";
import type { ImageUrl } from "../valueObjects/imageUrl";
import type { ProfileLink } from "../valueObjects/profileLink";
import type { PresentationPatternCode } from "../valueObjects/presentationPattern";
import {
  STORY_QUESTION_CODES,
  type StoryChapter,
  type StoryQuestionCode,
} from "../valueObjects/storyChapter";

const emptyProfileContent: ProfileContent = {
  name: null,
  tagline: null,
  imageUrl: null,
  chapters: [],
  activityInfo: null,
  genres: [],
  links: [],
  presentationPattern: null,
};

const beginDraft = (artistId: string): DraftProfile => ({
  kind: "draft",
  id: crypto.randomUUID(),
  artistId,
  content: emptyProfileContent,
});

export const draftIfAbsent = (state: ProfileState): StoredProfile =>
  state.kind === "noProfile" ? beginDraft(state.artistId) : state;

const withoutChapter = (
  chapters: readonly StoryChapter[],
  questionCode: StoryQuestionCode,
): StoryChapter[] =>
  chapters.filter((chapter) => chapter.questionCode !== questionCode);

export const reviseAttributes = (
  content: ProfileContent,
  attributes: ArtistProfileAttributes,
): ProfileContent => ({ ...content, ...attributes });

export const writeStoryChapter = (
  content: ProfileContent,
  chapter: StoryChapter,
): ProfileContent => ({
  ...content,
  chapters: [
    ...withoutChapter(content.chapters, chapter.questionCode),
    chapter,
  ],
});

export const clearStoryChapter = (
  content: ProfileContent,
  questionCode: StoryQuestionCode,
): ProfileContent => ({
  ...content,
  chapters: withoutChapter(content.chapters, questionCode),
});

export const replaceLinks = (
  content: ProfileContent,
  links: readonly ProfileLink[],
): ProfileContent => ({ ...content, links });

export const choosePresentationPattern = (
  content: ProfileContent,
  pattern: PresentationPatternCode,
): ProfileContent => ({ ...content, presentationPattern: pattern });

export const changeImage = (
  content: ProfileContent,
  imageUrl: ImageUrl,
): ProfileContent => ({ ...content, imageUrl });

export const unpublish = (state: PublishedProfile): DraftProfile => ({
  kind: "draft",
  id: state.id,
  artistId: state.artistId,
  content: state.content,
});

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

const toLinkData = (links: readonly ProfileLink[]): ProfileLinkData[] =>
  links.map((link) => ({ linkTypeCode: link.linkTypeCode, url: link.url }));

export const toView = (state: StoredProfile): ArtistProfileView => ({
  attributes: {
    name: valueOrNull(state.content.name),
    imageUrl: valueOrNull(state.content.imageUrl),
    tagline: valueOrNull(state.content.tagline),
    genres: state.content.genres.map((genre) => genre.value),
    activityInfo: valueOrNull(state.content.activityInfo),
  },
  story: {
    chapters: toOrderedChapters(state.content.chapters).map((chapter) => ({
      key: chapter.questionCode,
      body: chapter.body,
    })),
  },
  links: toLinkData(state.content.links),
  presentation: { patternCode: state.content.presentationPattern },
  published: state.kind === "published",
});

export const toPersistence = (
  state: StoredProfile,
): ArtistProfilePersistenceData => ({
  id: state.id,
  artistId: state.artistId,
  name: valueOrNull(state.content.name),
  tagline: valueOrNull(state.content.tagline),
  imageUrl: valueOrNull(state.content.imageUrl),
  chapters: toOrderedChapters(state.content.chapters),
  activityInfo: valueOrNull(state.content.activityInfo),
  genres: state.content.genres.map((genre) => genre.value),
  links: toLinkData(state.content.links),
  presentationPatternCode: state.content.presentationPattern,
  published: state.kind === "published",
});
