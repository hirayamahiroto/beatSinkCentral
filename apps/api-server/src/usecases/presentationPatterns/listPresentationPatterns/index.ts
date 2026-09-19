import type { PresentationPatternView } from "../../../domain/presentationPatterns/entities";
import type { PublicReadCapabilities } from "../../capabilities";
import { type Result, ok } from "../../../utils/result";

export type ListPresentationPatternsOutput = {
  presentationPatterns: PresentationPatternView[];
};

type ListPresentationPatternsCaps = Pick<
  PublicReadCapabilities,
  "presentationPatterns"
>;

export const listPresentationPatterns = async (
  caps: ListPresentationPatternsCaps,
): Promise<Result<ListPresentationPatternsOutput, never>> => {
  const presentationPatterns = await caps.presentationPatterns.findAll();

  return ok({ presentationPatterns });
};
