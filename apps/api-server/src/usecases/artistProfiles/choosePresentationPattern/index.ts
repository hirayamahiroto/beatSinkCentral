import type { ArtistProfilePresentationView } from "../../../domain/artistProfiles/entities";
import {
  createPresentationPatternCode,
  type InvalidPresentationPatternError,
} from "../../../domain/artistProfiles/valueObjects/presentationPattern";
import {
  choosePresentationPattern as choosePattern,
  toView,
} from "../../../domain/artistProfiles/behaviors";
import { edit } from "../../../domain/artistProfiles/policies/publishability";
import type { ArtistWriteCapabilities } from "../../../capabilities";
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

  const state = await caps.artistProfiles.load(caps.actor.artist.getArtistId());
  const saved = await caps.artistProfiles.save(
    edit(state, (content) => choosePattern(content, pattern.value)),
  );

  return ok({ presentation: toView(saved).presentation });
};
