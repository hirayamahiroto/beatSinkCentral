import type {
  ArtistProfile,
  ArtistProfileState,
  ArtistProfilePersistenceData,
  ArtistProfileView,
} from "../entities";

export const createArtistProfileBehaviors = (
  state: ArtistProfileState,
): ArtistProfile => {
  const toView = (): ArtistProfileView => ({
    name: state.name?.value ?? null,
    tagline: state.tagline?.value ?? null,
    imageUrl: state.imageUrl?.value ?? null,
    story: state.story?.value ?? null,
    activityInfo: state.activityInfo?.value ?? null,
    genres: state.genres.map((genre) => genre.value),
    snsLinks: state.snsLinks.map((sns) => sns.value),
    published: state.published,
  });

  return {
    getId: () => state.id,
    getArtistId: () => state.artistId,
    getName: () => state.name?.value ?? null,
    getTagline: () => state.tagline?.value ?? null,
    getImageUrl: () => state.imageUrl?.value ?? null,
    getStory: () => state.story?.value ?? null,
    getActivityInfo: () => state.activityInfo?.value ?? null,
    getGenres: () => state.genres.map((genre) => genre.value),
    getSnsLinks: () => state.snsLinks.map((sns) => sns.value),
    isPublished: () => state.published,
    publish: () => createArtistProfileBehaviors({ ...state, published: true }),
    unpublish: () =>
      createArtistProfileBehaviors({ ...state, published: false }),
    toPersistence: (): ArtistProfilePersistenceData => ({
      id: state.id,
      artistId: state.artistId,
      name: state.name?.value ?? null,
      tagline: state.tagline?.value ?? null,
      imageUrl: state.imageUrl?.value ?? null,
      story: state.story?.value ?? null,
      activityInfo: state.activityInfo?.value ?? null,
      genres: state.genres.map((genre) => genre.value),
      snsLinks: state.snsLinks.map((sns) => sns.value),
      published: state.published,
    }),
    toView,
  };
};
