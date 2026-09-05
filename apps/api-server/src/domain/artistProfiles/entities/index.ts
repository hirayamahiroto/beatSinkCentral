import type { ProfileName } from "../valueObjects/profileName";
import type { Tagline } from "../valueObjects/tagline";
import type { ImageUrl } from "../valueObjects/imageUrl";
import type {
  StoryChapter,
  StoryQuestionCode,
} from "../valueObjects/storyChapter";
import type { ActivityInfo } from "../valueObjects/activityInfo";
import type { Genre } from "../valueObjects/genre";
import type { ProfileLink } from "../valueObjects/profileLink";

export type ProfileLinkData = {
  linkTypeCode: string;
  url: string;
};

export type StoryChapterData = {
  questionCode: string;
  body: string;
};

export type ArtistProfileState = {
  readonly id: string;
  readonly artistId: string;
  readonly name: ProfileName | null;
  readonly tagline: Tagline | null;
  readonly imageUrl: ImageUrl | null;
  readonly chapters: readonly StoryChapter[];
  readonly activityInfo: ActivityInfo | null;
  readonly genres: readonly Genre[];
  readonly links: readonly ProfileLink[];
  readonly published: boolean;
};

export type ArtistProfileAttributes = Pick<
  ArtistProfileState,
  "name" | "tagline" | "genres" | "activityInfo"
>;

export type ArtistProfilePersistenceData = {
  id: string;
  artistId: string;
  name: string | null;
  tagline: string | null;
  imageUrl: string | null;
  chapters: StoryChapterData[];
  activityInfo: string | null;
  genres: string[];
  links: ProfileLinkData[];
  published: boolean;
};

export type ArtistProfileAttributesView = {
  name: string | null;
  imageUrl: string | null;
  tagline: string | null;
  genres: string[];
  activityInfo: string | null;
};

export type StoryChapterView = {
  key: string;
  body: string;
};

export type ArtistProfileStoryView = {
  chapters: StoryChapterView[];
};

export type ArtistProfileView = {
  attributes: ArtistProfileAttributesView;
  story: ArtistProfileStoryView;
  links: ProfileLinkData[];
  published: boolean;
};

export type ArtistProfile = {
  getId: () => string;
  getArtistId: () => string;
  getName: () => string | null;
  getTagline: () => string | null;
  getImageUrl: () => string | null;
  getChapters: () => StoryChapterData[];
  getActivityInfo: () => string | null;
  getGenres: () => string[];
  getLinks: () => ProfileLinkData[];
  isPublished: () => boolean;
  publish: () => ArtistProfile;
  unpublish: () => ArtistProfile;
  reviseAttributes: (attributes: ArtistProfileAttributes) => ArtistProfile;
  writeStoryChapter: (chapter: StoryChapter) => ArtistProfile;
  clearStoryChapter: (questionCode: StoryQuestionCode) => ArtistProfile;
  replaceLinks: (links: readonly ProfileLink[]) => ArtistProfile;
  changeImage: (imageUrl: ImageUrl) => ArtistProfile;
  toPersistence: () => ArtistProfilePersistenceData;
  toView: () => ArtistProfileView;
};
