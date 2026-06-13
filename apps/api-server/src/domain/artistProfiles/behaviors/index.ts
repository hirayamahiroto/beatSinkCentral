import type {
  ArtistProfile,
  ArtistProfileState,
  ArtistProfilePersistenceData,
  ArtistProfileView,
} from "../entities";

const valueOrNull = (vo: { readonly value: string } | null): string | null =>
  vo === null ? null : vo.value;

export const createArtistProfileBehaviors = (
  state: ArtistProfileState,
): ArtistProfile => {
  const toContent = (): ArtistProfileView => ({
    name: valueOrNull(state.name),
    tagline: valueOrNull(state.tagline),
    imageUrl: valueOrNull(state.imageUrl),
    story: valueOrNull(state.story),
    activityInfo: valueOrNull(state.activityInfo),
    genres: state.genres.map((genre) => genre.value),
    snsLinks: state.snsLinks.map((sns) => sns.value),
    published: state.published,
  });

  return {
    getId: () => state.id,
    getArtistId: () => state.artistId,
    getName: () => valueOrNull(state.name),
    getTagline: () => valueOrNull(state.tagline),
    getImageUrl: () => valueOrNull(state.imageUrl),
    getStory: () => valueOrNull(state.story),
    getActivityInfo: () => valueOrNull(state.activityInfo),
    getGenres: () => state.genres.map((genre) => genre.value),
    getSnsLinks: () => state.snsLinks.map((sns) => sns.value),
    isPublished: () => state.published,
    publish: () => createArtistProfileBehaviors({ ...state, published: true }),
    unpublish: () =>
      createArtistProfileBehaviors({ ...state, published: false }),
    toPersistence: (): ArtistProfilePersistenceData => ({
      id: state.id,
      artistId: state.artistId,
      ...toContent(),
    }),
    toView: toContent,
  };
};
