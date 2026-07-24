import type { ProfileName } from "../valueObjects/profileName";
import type { Tagline } from "../valueObjects/tagline";
import type { ImageUrl } from "../valueObjects/imageUrl";
import type { Story } from "../valueObjects/story";
import type { ActivityInfo } from "../valueObjects/activityInfo";
import type { Genre } from "../valueObjects/genre";
import type { ProfileLink } from "../valueObjects/profileLink";

export type NonEmptyArray<T> = readonly [T, ...T[]];

export const isNonEmpty = <T>(
  values: readonly T[],
): values is NonEmptyArray<T> => values.length > 0;

export type DraftProfile = {
  readonly status: "draft";
  readonly id: string;
  readonly artistId: string;
  readonly name: ProfileName | null;
  readonly tagline: Tagline | null;
  readonly imageUrl: ImageUrl | null;
  readonly story: Story | null;
  readonly activityInfo: ActivityInfo | null;
  readonly genres: readonly Genre[];
  readonly links: readonly ProfileLink[];
};

export type PublishedProfile = {
  readonly status: "published";
  readonly id: string;
  readonly artistId: string;
  readonly name: ProfileName;
  readonly tagline: Tagline | null;
  readonly imageUrl: ImageUrl;
  readonly story: Story;
  readonly activityInfo: ActivityInfo | null;
  readonly genres: NonEmptyArray<Genre>;
  readonly links: NonEmptyArray<ProfileLink>;
};

export type Profile = DraftProfile | PublishedProfile;
