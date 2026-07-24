import { type Result, ok, err } from "../../../shared/result";

export type LinkTypeCode = {
  readonly _tag: "LinkTypeCode";
  readonly value: string;
};

export type InvalidLinkTypeCodeError = {
  readonly type: "InvalidLinkTypeCodeError";
};

export const createLinkTypeCode = (
  value: string,
): Result<LinkTypeCode, InvalidLinkTypeCodeError> => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return err({ type: "InvalidLinkTypeCodeError" });
  }
  return ok({ _tag: "LinkTypeCode", value: trimmed });
};
