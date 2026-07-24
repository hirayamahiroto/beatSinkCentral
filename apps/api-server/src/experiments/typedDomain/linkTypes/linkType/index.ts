import { type Result, err, map } from "../../shared/result";
import {
  createLinkTypeCode,
  type LinkTypeCode,
  type InvalidLinkTypeCodeError,
} from "../valueObjects/linkTypeCode";

export type LinkType = {
  readonly code: LinkTypeCode;
  readonly label: string;
};

export type InvalidLinkTypeLabelError = {
  readonly type: "InvalidLinkTypeLabelError";
};

export type CreateLinkTypeError =
  | InvalidLinkTypeCodeError
  | InvalidLinkTypeLabelError;

export type CreateLinkTypeInput = {
  readonly code: string;
  readonly label: string;
};

export const createLinkType = (
  input: CreateLinkTypeInput,
): Result<LinkType, CreateLinkTypeError> => {
  const label = input.label.trim();
  if (label.length === 0) {
    return err({ type: "InvalidLinkTypeLabelError" });
  }
  return map(createLinkTypeCode(input.code), (code) => ({ code, label }));
};
