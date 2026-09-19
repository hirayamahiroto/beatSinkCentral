import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

export type CalendarDate = {
  readonly value: string;
};

export type InvalidCalendarDateFormatError = Error & {
  readonly type: "InvalidCalendarDateFormatError";
};

const createInvalidCalendarDateFormatError =
  (): InvalidCalendarDateFormatError =>
    createTypedError("InvalidCalendarDateFormatError");

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isRealDate = (value: string): boolean => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const createCalendarDate = (
  value: string,
): Result<CalendarDate, InvalidCalendarDateFormatError> => {
  const trimmed = value.trim();
  if (!CALENDAR_DATE_PATTERN.test(trimmed) || !isRealDate(trimmed)) {
    return err(createInvalidCalendarDateFormatError());
  }
  return ok({ value: trimmed });
};
