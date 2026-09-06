import type {
  Offer,
  OfferContent,
  OfferPersistenceData,
  OfferState,
  OfferView,
} from "../entities";

export const createOfferBehaviors = (state: OfferState): Offer => ({
  getDate: () => state.date.value,
  revise: (content: OfferContent) =>
    createOfferBehaviors({ ...state, ...content }),
  toPersistence: (): OfferPersistenceData => ({
    id: state.id,
    artistId: state.artistId,
    date: state.date.value,
    place: state.place.value,
    ticketUrl: state.ticketUrl.value,
    comment: state.comment.value,
    coPerformers: state.coPerformers.map((coPerformer) => ({
      name: coPerformer.name,
      artistId: coPerformer.artist ? coPerformer.artist.artistId : null,
    })),
  }),
  toView: (): OfferView => ({
    date: state.date.value,
    place: state.place.value,
    ticketUrl: state.ticketUrl.value,
    comment: state.comment.value,
    coPerformers: state.coPerformers.map((coPerformer) => ({
      name: coPerformer.name,
      handle: coPerformer.artist ? coPerformer.artist.handle : null,
    })),
  }),
});
