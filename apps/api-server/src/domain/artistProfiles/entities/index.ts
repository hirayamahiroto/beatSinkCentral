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

export type ProfileContentFields = {
  readonly name: ProfileName | null;
  readonly tagline: Tagline | null;
  readonly imageUrl: ImageUrl | null;
  readonly story: Story | null;
  readonly activityInfo: ActivityInfo | null;
  readonly genres: readonly Genre[];
  readonly links: readonly ProfileLink[];
};

type ProfileIdentity = {
  readonly id: string;
  readonly artistId: string;
};

export type DraftProfile = ProfileIdentity &
  ProfileContentFields & {
    readonly _tag: "Draft";
  };

export type PublishedProfile = ProfileIdentity &
  ProfileContentFields & {
    readonly _tag: "Published";
  };

export type ArtistProfile = DraftProfile | PublishedProfile;
