import type {
  ArtistProfile,
  DraftProfile,
  PublishedProfile,
  ArtistProfilePersistenceData,
  ArtistProfileView,
  PublishedProfileView,
  NonEmptyArray,
  ReadonlyNonEmptyArray,
  ProfileLinkData,
} from "../entities";
import {
  collectMissingPublishFields,
  createProfileNotPublishableError,
  isPublishable,
  type ProfileNotPublishableError,
} from "../policies/assertProfilePublishable";
import { type Result, ok, err } from "../../../utils/result";

const valueOrNull = (vo: { readonly value: string } | null): string | null =>
  vo === null ? null : vo.value;

const toLinkData = (link: {
  readonly type: string;
  readonly url: string;
  readonly label: string | null;
}): ProfileLinkData => ({
  type: link.type,
  url: link.url,
  label: link.label,
});

const mapNonEmpty = <T, U>(
  items: ReadonlyNonEmptyArray<T>,
  transform: (item: T) => U,
): NonEmptyArray<U> => {
  const [head, ...tail] = items;
  return [transform(head), ...tail.map(transform)];
};

export const isPublished = (
  profile: ArtistProfile,
): profile is PublishedProfile => profile._tag === "Published";

export const toView = (profile: ArtistProfile): ArtistProfileView => ({
  name: valueOrNull(profile.name),
  tagline: valueOrNull(profile.tagline),
  imageUrl: valueOrNull(profile.imageUrl),
  story: valueOrNull(profile.story),
  activityInfo: valueOrNull(profile.activityInfo),
  genres: profile.genres.map((genre) => genre.value),
  links: profile.links.map(toLinkData),
  published: isPublished(profile),
});

export const toPublishedView = (
  profile: PublishedProfile,
): PublishedProfileView => ({
  name: profile.name.value,
  tagline: valueOrNull(profile.tagline),
  imageUrl: profile.imageUrl.value,
  story: profile.story.value,
  activityInfo: valueOrNull(profile.activityInfo),
  genres: mapNonEmpty(profile.genres, (genre) => genre.value),
  links: mapNonEmpty(profile.links, toLinkData),
  published: true,
});

export const toPersistence = (
  profile: ArtistProfile,
): ArtistProfilePersistenceData => ({
  id: profile.id,
  artistId: profile.artistId,
  ...toView(profile),
});

export const publish = (
  profile: ArtistProfile,
): Result<PublishedProfile, ProfileNotPublishableError> => {
  if (!isPublishable(profile)) {
    return err(
      createProfileNotPublishableError(collectMissingPublishFields(profile)),
    );
  }

  const published: PublishedProfile = { ...profile, _tag: "Published" };
  return ok(published);
};

export const unpublish = (profile: ArtistProfile): DraftProfile => ({
  ...profile,
  _tag: "Draft",
});
