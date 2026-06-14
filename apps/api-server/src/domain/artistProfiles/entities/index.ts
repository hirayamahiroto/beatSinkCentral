import type { ProfileName } from "../valueObjects/profileName";
import type { Tagline } from "../valueObjects/tagline";
import type { ImageUrl } from "../valueObjects/imageUrl";
import type { Story } from "../valueObjects/story";
import type { ActivityInfo } from "../valueObjects/activityInfo";
import type { Genre } from "../valueObjects/genre";
import type { ProfileLink } from "../valueObjects/profileLink";

export type ProfileLinkData = {
  type: string;
  url: string;
  label: string | null;
};

export type ArtistProfileState = {
  readonly id: string;
  readonly artistId: string;
  readonly name: ProfileName | null;
  readonly tagline: Tagline | null;
  readonly imageUrl: ImageUrl | null;
  readonly story: Story | null;
  readonly activityInfo: ActivityInfo | null;
  readonly genres: readonly Genre[];
  readonly links: readonly ProfileLink[];
  readonly published: boolean;
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

export type ArtistProfile = {
  getId: () => string;
  getArtistId: () => string;
  getName: () => string | null;
  getTagline: () => string | null;
  getImageUrl: () => string | null;
  getStory: () => string | null;
  getActivityInfo: () => string | null;
  getGenres: () => string[];
  getLinks: () => ProfileLinkData[];
  isPublished: () => boolean;
  publish: () => ArtistProfile;
  unpublish: () => ArtistProfile;
  toPersistence: () => ArtistProfilePersistenceData;
  toView: () => ArtistProfileView;
};
