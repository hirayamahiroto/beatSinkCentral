import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

export type Handle = {
  readonly value: string;
};

export type InvalidHandleFormatError = Error & {
  readonly type: "InvalidHandleFormatError";
};

const createInvalidHandleFormatError = (): InvalidHandleFormatError =>
  createTypedError("InvalidHandleFormatError");

const handleSchema = z
  .string()
  .trim()
  .min(1, "handle is required")
  .max(255, "handle must be 255 characters or less")
  .regex(/^[a-zA-Z0-9_]+$/, "handle must be alphanumeric and underscores only");

export const createHandle = (
  value: string,
): Result<Handle, InvalidHandleFormatError> => {
  const result = handleSchema.safeParse(value);
  if (!result.success) {
    return err(createInvalidHandleFormatError());
  }
  return ok({ value: result.data });
};
