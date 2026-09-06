import type { OfferEditorValues } from "@ui/design-system/components/organisms/OfferEditor";

export type OfferView = {
  date: string;
  place: string;
  ticketUrl: string;
  comment: string;
  coPerformers: { name: string; handle: string | null }[];
};

export const toOfferEditorValues = (offer: OfferView): OfferEditorValues => ({
  date: offer.date,
  place: offer.place,
  ticketUrl: offer.ticketUrl,
  comment: offer.comment,
  coPerformers: offer.coPerformers.map(({ name, handle }) => ({
    name,
    handle: handle === null ? "" : handle,
  })),
});
