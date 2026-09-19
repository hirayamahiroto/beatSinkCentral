import type { ArtistProfilePresentationView } from "../../../domain/artistProfiles/entities";
import {
  createPresentationPatternCode,
  type InvalidPresentationPatternError,
} from "../../../domain/artistProfiles/valueObjects/presentationPattern";
import type { ArtistWriteCapabilities } from "../../capabilities";
import { loadOrDraftMyProfile } from "../loadOrDraftMyProfile";
import { persistMyProfile } from "../persistMyProfile";
import { type Result, ok } from "../../../utils/result";

export type ChoosePresentationPatternInput = {
  patternCode: string;
};

export type ChoosePresentationPatternOutput = {
  presentation: ArtistProfilePresentationView;
};

export type ChoosePresentationPatternError = InvalidPresentationPatternError;

type ChoosePresentationPatternCaps = Pick<
  ArtistWriteCapabilities,
  "actor" | "artistProfiles"
>;

export const choosePresentationPattern = async (
  caps: ChoosePresentationPatternCaps,
  input: ChoosePresentationPatternInput,
): Promise<
  Result<ChoosePresentationPatternOutput, ChoosePresentationPatternError>
> => {
  const pattern = createPresentationPatternCode(input.patternCode);
  if (!pattern.ok) return pattern;

  const profile = await loadOrDraftMyProfile(caps);
  const saved = await persistMyProfile(
    caps,
    profile.choosePresentationPattern(pattern.value),
  );

  return ok({ presentation: saved.toView().presentation });
};
