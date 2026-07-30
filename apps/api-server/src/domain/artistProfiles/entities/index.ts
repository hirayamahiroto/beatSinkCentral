import type { ProfileName } from "../valueObjects/profileName";
import type { Tagline } from "../valueObjects/tagline";
import type { ImageUrl } from "../valueObjects/imageUrl";
import type { Story } from "../valueObjects/story";
import type { ActivityInfo } from "../valueObjects/activityInfo";
import type { Genre } from "../valueObjects/genre";
import type { ProfileLink } from "../valueObjects/profileLink";

export type NonEmptyArray<T> = [T, ...T[]];

export type ReadonlyNonEmptyArray<T> = readonly [T, ...T[]];

export type ProfileLinkData = {
  type: string;
  url: string;
  label: string | null;
};

export type ArtistProfilePersistenceData = {
  id: string;
  artistId: string;
  name: string | null;
  tagline: string | null;
  imageUrl: string | null;
  story: string | null;
  activityInfo: string | null;
  genres: string[];
  links: ProfileLinkData[];
  published: boolean;
};

export type ArtistProfileView = {
  name: string | null;
  tagline: string | null;
  imageUrl: string | null;
  story: string | null;
  activityInfo: string | null;
  genres: string[];
  links: ProfileLinkData[];
  published: boolean;
};

export type PublishedProfileView = {
  name: string;
  tagline: string | null;
  imageUrl: string;
  story: string;
  activityInfo: string | null;
  genres: NonEmptyArray<string>;
  links: NonEmptyArray<ProfileLinkData>;
  published: true;
};

type ProfileOptionalFields = {
  readonly tagline: Tagline | null;
  readonly activityInfo: ActivityInfo | null;
};

export type ProfileContentFields = ProfileOptionalFields & {
  readonly name: ProfileName | null;
  readonly imageUrl: ImageUrl | null;
  readonly story: Story | null;
  readonly genres: readonly Genre[];
  readonly links: readonly ProfileLink[];
};

export type PublishRequiredFields = {
  readonly name: ProfileName;
  readonly imageUrl: ImageUrl;
  readonly story: Story;
  readonly genres: ReadonlyNonEmptyArray<Genre>;
  readonly links: ReadonlyNonEmptyArray<ProfileLink>;
};

export type PublishedContentFields = ProfileOptionalFields &
  PublishRequiredFields;

type ProfileIdentity = {
  readonly id: string;
  readonly artistId: string;
};

export type DraftProfile = ProfileIdentity &
  ProfileContentFields & {
    readonly _tag: "Draft";
  };

export type PublishedProfile = ProfileIdentity &
  PublishedContentFields & {
    readonly _tag: "Published";
  };

export type ArtistProfile = DraftProfile | PublishedProfile;
