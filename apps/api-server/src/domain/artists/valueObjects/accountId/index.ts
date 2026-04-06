import { z } from "zod";

export type AccountId = {
  readonly value: string;
};

const accountIdSchema = z
  .string()
  .trim()
  .min(1, "accountId is required")
  .max(255, "accountId must be 255 characters or less")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "accountId must be alphanumeric and underscores only"
  );

export const createAccountId = (value: string): AccountId => {
  const parsed = accountIdSchema.parse(value);
  return { value: parsed };
};
