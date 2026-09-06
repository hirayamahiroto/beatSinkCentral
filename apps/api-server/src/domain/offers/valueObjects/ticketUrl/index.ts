import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

export type TicketUrl = {
  readonly value: string;
};

export type InvalidTicketUrlFormatError = Error & {
  readonly type: "InvalidTicketUrlFormatError";
};

const createInvalidTicketUrlFormatError = (): InvalidTicketUrlFormatError =>
  createTypedError("InvalidTicketUrlFormatError");

const ticketUrlSchema = z
  .string()
  .trim()
  .min(1, "ticketUrl is required")
  .max(2048, "ticketUrl must be 2048 characters or less")
  .url("ticketUrl must be a valid URL");

export const createTicketUrl = (
  value: string,
): Result<TicketUrl, InvalidTicketUrlFormatError> => {
  const result = ticketUrlSchema.safeParse(value);
  if (!result.success) {
    return err(createInvalidTicketUrlFormatError());
  }
  return ok({ value: result.data });
};
