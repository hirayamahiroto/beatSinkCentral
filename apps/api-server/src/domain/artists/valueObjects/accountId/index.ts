import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";

export type AccountId = {
  readonly value: string;
};

export type InvalidAccountIdFormatError = Error & {
  readonly type: "InvalidAccountIdFormatError";
};

export const createInvalidAccountIdFormatError =
  (): InvalidAccountIdFormatError =>
    createTypedError("InvalidAccountIdFormatError");

const accountIdSchema = z
  .string()
  .trim()
  .min(1, "accountId is required")
  .max(255, "accountId must be 255 characters or less")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "accountId must be alphanumeric and underscores only",
  );

export const createAccountId = (value: string): AccountId => {
  const result = accountIdSchema.safeParse(value);
  if (!result.success) {
    throw createInvalidAccountIdFormatError();
  }
  return { value: result.data };
};
