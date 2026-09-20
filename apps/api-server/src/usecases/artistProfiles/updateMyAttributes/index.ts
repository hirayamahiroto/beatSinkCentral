import type { ArtistProfileAttributesView } from "../../../domain/artistProfiles/entities";
import {
  createProfileAttributes,
  type ArtistProfileAttributesContent,
  type ArtistProfileAttributesError,
} from "../../../domain/artistProfiles/factories";
import {
  reviseAttributes,
  toView,
} from "../../../domain/artistProfiles/behaviors";
import { edit } from "../../../domain/artistProfiles/policies/publishability";
import type { ArtistWriteCapabilities } from "../../../capabilities";
import { type Result, ok } from "../../../utils/result";

export type UpdateMyAttributesInput = ArtistProfileAttributesContent;

export type UpdateMyAttributesOutput = {
  attributes: ArtistProfileAttributesView;
};

export type UpdateMyAttributesError = ArtistProfileAttributesError;

type UpdateMyAttributesCaps = Pick<
  ArtistWriteCapabilities,
  "actor" | "artistProfiles"
>;

export const updateMyAttributes = async (
  caps: UpdateMyAttributesCaps,
  input: UpdateMyAttributesInput,
): Promise<Result<UpdateMyAttributesOutput, UpdateMyAttributesError>> => {
  const attributes = createProfileAttributes(input);
  if (!attributes.ok) return attributes;

  const state = await caps.artistProfiles.load(caps.actor.artist.getArtistId());
  const saved = await caps.artistProfiles.save(
    edit(state, (content) => reviseAttributes(content, attributes.value)),
  );

  return ok({ attributes: toView(saved).attributes });
};
