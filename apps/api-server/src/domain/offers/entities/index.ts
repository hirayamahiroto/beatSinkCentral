import type { CalendarDate } from "../valueObjects/calendarDate";
import type { Place } from "../valueObjects/place";
import type { TicketUrl } from "../valueObjects/ticketUrl";
import type { OfferComment } from "../valueObjects/offerComment";
import type { CoPerformer } from "../valueObjects/coPerformer";

export type OfferContent = {
  readonly date: CalendarDate;
  readonly place: Place;
  readonly ticketUrl: TicketUrl;
  readonly comment: OfferComment;
  readonly coPerformers: readonly CoPerformer[];
};

export type OfferState = OfferContent & {
  readonly id: string;
  readonly artistId: string;
};

type CoPerformerPersistenceData = {
  name: string;
  artistId: string | null;
};

export type OfferPersistenceData = {
  id: string;
  artistId: string;
  date: string;
  place: string;
  ticketUrl: string;
  comment: string;
  coPerformers: CoPerformerPersistenceData[];
};

type CoPerformerView = {
  name: string;
  handle: string | null;
};

export type OfferView = {
  date: string;
  place: string;
  ticketUrl: string;
  comment: string;
  coPerformers: CoPerformerView[];
};

export type Offer = {
  getDate: () => string;
  revise: (content: OfferContent) => Offer;
  toPersistence: () => OfferPersistenceData;
  toView: () => OfferView;
};
