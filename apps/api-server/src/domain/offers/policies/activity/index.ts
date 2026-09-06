import type { Offer } from "../../entities";
import type { CalendarDate } from "../../valueObjects/calendarDate";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

const OFFER_TIME_ZONE = "Asia/Tokyo";

const calendarDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: OFFER_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const hasNotPassed = (date: string, now: Date): boolean =>
  date >= calendarDateFormatter.format(now);

export const isOfferActiveAt = (offer: Offer, now: Date): boolean =>
  hasNotPassed(offer.getDate(), now);

export type OfferDatePassedError = Error & {
  readonly type: "OfferDatePassedError";
};

const createOfferDatePassedError = (): OfferDatePassedError =>
  createTypedError("OfferDatePassedError");

export const ensureOfferDateNotPassed = (
  date: CalendarDate,
  now: Date,
): Result<void, OfferDatePassedError> =>
  hasNotPassed(date.value, now)
    ? ok(undefined)
    : err(createOfferDatePassedError());
