import type { OfferEditorValues } from "@ui/design-system/components/organisms/OfferEditor";
import type { SaveMyOfferInput } from "../../../../fetchers/artists/saveMyOffer";

export const toSaveOfferRequest = (
  values: OfferEditorValues,
): SaveMyOfferInput => ({
  date: values.date,
  place: values.place,
  ticketUrl: values.ticketUrl,
  comment: values.comment,
  coPerformers: values.coPerformers.map(({ name, handle }) => ({
    name,
    handle: handle.trim().length === 0 ? null : handle.trim(),
  })),
});
