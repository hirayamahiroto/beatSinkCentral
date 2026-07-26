import type {
  ArtistProfile,
  DraftProfile,
  PublishedProfile,
  ArtistProfilePersistenceData,
  ArtistProfileView,
} from "../entities";

const valueOrNull = (vo: { readonly value: string } | null): string | null =>
  vo === null ? null : vo.value;

export const isPublished = (profile: ArtistProfile): boolean =>
  profile._tag === "Published";

export const toView = (profile: ArtistProfile): ArtistProfileView => ({
  name: valueOrNull(profile.name),
  tagline: valueOrNull(profile.tagline),
  imageUrl: valueOrNull(profile.imageUrl),
  story: valueOrNull(profile.story),
  activityInfo: valueOrNull(profile.activityInfo),
  genres: profile.genres.map((genre) => genre.value),
  links: profile.links.map((link) => ({
    type: link.type,
    url: link.url,
    label: link.label,
  })),
  published: isPublished(profile),
});

export const toPersistence = (
  profile: ArtistProfile,
): ArtistProfilePersistenceData => ({
  id: profile.id,
  artistId: profile.artistId,
  ...toView(profile),
});

export const publish = (profile: ArtistProfile): PublishedProfile => ({
  ...profile,
  _tag: "Published",
});

export const unpublish = (profile: ArtistProfile): DraftProfile => ({
  ...profile,
  _tag: "Draft",
});
