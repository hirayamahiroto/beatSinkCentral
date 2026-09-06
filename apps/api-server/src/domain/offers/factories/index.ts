import {
  createCalendarDate,
  type InvalidCalendarDateFormatError,
} from "../valueObjects/calendarDate";
import {
  createPlace,
  type InvalidPlaceFormatError,
} from "../valueObjects/place";
import {
  createTicketUrl,
  type InvalidTicketUrlFormatError,
} from "../valueObjects/ticketUrl";
import {
  createOfferComment,
  type InvalidOfferCommentFormatError,
} from "../valueObjects/offerComment";
import {
  createCoPerformer,
  type CoPerformerInput,
  type InvalidCoPerformerFormatError,
} from "../valueObjects/coPerformer";
import { createOfferBehaviors } from "../behaviors";
import type { Offer, OfferContent } from "../entities";
import {
  type Result,
  all,
  map,
  traverse,
  unwrapOrThrow,
} from "../../../utils/result";

export type OfferContentInput = {
  date: string;
  place: string;
  ticketUrl: string;
  comment: string;
  coPerformers: CoPerformerInput[];
};

export type OfferContentError =
  | InvalidCalendarDateFormatError
  | InvalidPlaceFormatError
  | InvalidTicketUrlFormatError
  | InvalidOfferCommentFormatError
  | InvalidCoPerformerFormatError;

export const createOfferContent = (
  input: OfferContentInput,
): Result<OfferContent, OfferContentError> =>
  all({
    date: createCalendarDate(input.date),
    place: createPlace(input.place),
    ticketUrl: createTicketUrl(input.ticketUrl),
    comment: createOfferComment(input.comment),
    coPerformers: traverse(input.coPerformers, createCoPerformer),
  });

export type CreateOfferParams = {
  artistId: string;
  content: OfferContent;
};

export const createOffer = (params: CreateOfferParams): Offer =>
  createOfferBehaviors({
    id: crypto.randomUUID(),
    artistId: params.artistId,
    ...params.content,
  });

export type ReconstructOfferParams = OfferContentInput & {
  id: string;
  artistId: string;
};

export const reconstructOffer = (params: ReconstructOfferParams): Offer =>
  unwrapOrThrow(
    map(createOfferContent(params), (content) =>
      createOfferBehaviors({
        id: params.id,
        artistId: params.artistId,
        ...content,
      }),
    ),
    "reconstructOffer: stored offer has invalid field values",
  );
