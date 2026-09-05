import type { ImmersivePatternCode } from "@ui/design-system/components/organisms/ArtistImmersiveProfile";
import {
  DEFAULT_PRESENTATION_PATTERN,
  toImmersivePatternCode,
} from "../../../../../libs/presentationPattern";
import { createUpstreamContractViolationError } from "../../errors/upstreamContractViolation";

export const resolvePresentationPattern = (
  patternCode: string | null,
): ImmersivePatternCode => {
  if (patternCode === null) return DEFAULT_PRESENTATION_PATTERN;

  const pattern = toImmersivePatternCode(patternCode);
  if (pattern === undefined) {
    throw createUpstreamContractViolationError({
      upstreamStatus: 200,
      reason: "unknown presentation pattern",
    });
  }
  return pattern;
};
