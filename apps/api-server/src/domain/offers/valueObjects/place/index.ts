import { z } from "zod";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

export type Place = {
  readonly value: string;
};

export type InvalidPlaceFormatError = Error & {
  readonly type: "InvalidPlaceFormatError";
};

const createInvalidPlaceFormatError = (): InvalidPlaceFormatError =>
  createTypedError("InvalidPlaceFormatError");

const placeSchema = z
  .string()
  .trim()
  .min(1, "place is required")
  .max(255, "place must be 255 characters or less");

export const createPlace = (
  value: string,
): Result<Place, InvalidPlaceFormatError> => {
  const result = placeSchema.safeParse(value);
  if (!result.success) {
    return err(createInvalidPlaceFormatError());
  }
  return ok({ value: result.data });
};
