import type { ProfileName } from "../valueObjects/profileName";
import type { Tagline } from "../valueObjects/tagline";
import type { ImageUrl } from "../valueObjects/imageUrl";
import type { StoryChapter } from "../valueObjects/storyChapter";
import type { ActivityInfo } from "../valueObjects/activityInfo";
import type { Genre } from "../valueObjects/genre";
import type { ProfileLink } from "../valueObjects/profileLink";
import type { PresentationPatternCode } from "../valueObjects/presentationPattern";

export type ProfileContent = {
  readonly name: ProfileName | null;
  readonly tagline: Tagline | null;
  readonly imageUrl: ImageUrl | null;
  readonly chapters: readonly StoryChapter[];
  readonly activityInfo: ActivityInfo | null;
  readonly genres: readonly Genre[];
  readonly links: readonly ProfileLink[];
  readonly presentationPattern: PresentationPatternCode | null;
};

export type PublishableContent = ProfileContent & {
  readonly name: ProfileName;
  readonly imageUrl: ImageUrl;
  readonly chapters: readonly [StoryChapter, ...StoryChapter[]];
  readonly genres: readonly [Genre, ...Genre[]];
  readonly links: readonly [ProfileLink, ...ProfileLink[]];
};

export type ArtistProfileAttributes = Pick<
  ProfileContent,
  "name" | "tagline" | "genres" | "activityInfo"
>;

type NoProfile = {
  readonly kind: "noProfile";
  readonly artistId: string;
};

export type DraftProfile = {
  readonly kind: "draft";
  readonly id: string;
  readonly artistId: string;
  readonly content: ProfileContent;
};

export type PublishedProfile = {
  readonly kind: "published";
  readonly id: string;
  readonly artistId: string;
  readonly content: PublishableContent;
};

export type ProfileState = NoProfile | DraftProfile | PublishedProfile;

export type StoredProfile = DraftProfile | PublishedProfile;

export type ProfileLinkData = {
  linkTypeCode: string;
  url: string;
};

export type StoryChapterData = {
  questionCode: string;
  body: string;
};

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
  presentationPatternCode: string | null;
  published: boolean;
};

export type ArtistProfileAttributesView = {
  name: string | null;
  imageUrl: string | null;
  tagline: string | null;
  genres: string[];
  activityInfo: string | null;
};

type StoryChapterView = {
  key: string;
  body: string;
};

export type ArtistProfileStoryView = {
  chapters: StoryChapterView[];
};

export type ArtistProfilePresentationView = {
  patternCode: string | null;
};

export type ArtistProfileView = {
  attributes: ArtistProfileAttributesView;
  story: ArtistProfileStoryView;
  links: ProfileLinkData[];
  presentation: ArtistProfilePresentationView;
  published: boolean;
};
