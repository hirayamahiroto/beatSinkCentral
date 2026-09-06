import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err } from "../../../../utils/result";

export const PRESENTATION_PATTERN_CODES = [
  "interview",
  "zoom_dive",
  "spotlight",
  "editorial",
] as const;

export type PresentationPatternCode =
  (typeof PRESENTATION_PATTERN_CODES)[number];

const PRESENTATION_PATTERN_CODE_BY_VALUE = new Map<
  string,
  PresentationPatternCode
>(PRESENTATION_PATTERN_CODES.map((code) => [code, code] as const));

export const toPresentationPatternCode = (
  value: string,
): PresentationPatternCode | undefined =>
  PRESENTATION_PATTERN_CODE_BY_VALUE.get(value.trim());

export type InvalidPresentationPatternError = Error & {
  readonly type: "InvalidPresentationPatternError";
};

export const createInvalidPresentationPatternError =
  (): InvalidPresentationPatternError =>
    createTypedError("InvalidPresentationPatternError");

export const createPresentationPatternCode = (
  value: string,
): Result<PresentationPatternCode, InvalidPresentationPatternError> => {
  const code = toPresentationPatternCode(value);
  return code === undefined
    ? err(createInvalidPresentationPatternError())
    : ok(code);
};
