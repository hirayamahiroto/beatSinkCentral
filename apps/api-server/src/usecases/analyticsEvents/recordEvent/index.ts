import {
  createAnalyticsEvent,
  type RecordEventInput,
} from "../../../domain/analyticsEvents/factories";
import type { InvalidEventTypeFormatError } from "../../../domain/analyticsEvents/valueObjects/eventType";
import type { PublicWriteCapabilities } from "../../capabilities";
import { type Result, ok } from "../../../utils/result";

export type RecordEventUsecaseInput = RecordEventInput;

export type RecordEventError = InvalidEventTypeFormatError;

type RecordEventCaps = Pick<PublicWriteCapabilities, "analyticsEvents">;

export const recordEvent = async (
  caps: RecordEventCaps,
  input: RecordEventUsecaseInput,
): Promise<Result<void, RecordEventError>> => {
  const event = createAnalyticsEvent(input);
  if (!event.ok) return event;

  await caps.analyticsEvents.record(event.value.toPersistence());

  return ok(undefined);
};
