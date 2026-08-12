import type { LinkTypeView } from "../../../domain/linkTypes/entities";
import type { PublicReadCapabilities } from "../../capabilities";
import { type Result, ok } from "../../../utils/result";

export type ListLinkTypesOutput = {
  linkTypes: LinkTypeView[];
};

type ListLinkTypesCaps = Pick<PublicReadCapabilities, "linkTypes">;

export const listLinkTypes = async (
  caps: ListLinkTypesCaps,
): Promise<Result<ListLinkTypesOutput, never>> => {
  const linkTypes = await caps.linkTypes.findAll();

  return ok({ linkTypes });
};
