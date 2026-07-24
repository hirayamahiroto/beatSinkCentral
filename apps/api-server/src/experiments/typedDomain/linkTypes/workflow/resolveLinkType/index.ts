import { type Result, ok, err } from "../../../shared/result";
import type { LinkType } from "../../linkType";
import type { LinkTypeCode } from "../../valueObjects/linkTypeCode";

export type LinkTypeNotFoundError = {
  readonly type: "LinkTypeNotFoundError";
};

export const resolveLinkType = (
  master: readonly LinkType[],
  code: LinkTypeCode,
): Result<LinkType, LinkTypeNotFoundError> => {
  const found = master.find((linkType) => linkType.code.value === code.value);
  if (!found) {
    return err({ type: "LinkTypeNotFoundError" });
  }
  return ok(found);
};
