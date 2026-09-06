import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

export const ANALYTICS_EVENT_TYPES = [
  "profile_view",
  "story_expand",
  "story_scroll",
  "offer_click",
  "support_click",
  "listening_point_play",
  "notify_subscribe",
  "survey_answer",
  "invite_open",
  "invite_signup",
] as const;

export type AnalyticsEventTypeValue = (typeof ANALYTICS_EVENT_TYPES)[number];

export type EventType = {
  readonly value: AnalyticsEventTypeValue;
};

export type InvalidEventTypeFormatError = Error & {
  readonly type: "InvalidEventTypeFormatError";
};

export const createInvalidEventTypeFormatError =
  (): InvalidEventTypeFormatError =>
    createTypedError("InvalidEventTypeFormatError");

export const createEventType = (
  value: string,
): Result<EventType, InvalidEventTypeFormatError> => {
  const found = ANALYTICS_EVENT_TYPES.find((type) => type === value);
  if (!found) {
    return err(createInvalidEventTypeFormatError());
  }
  return ok({ value: found });
};
