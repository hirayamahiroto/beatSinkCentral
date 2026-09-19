import type { ArtistProfileAttributesView } from "../../../domain/artistProfiles/entities";
import {
  createProfileAttributes,
  type ArtistProfileAttributesContent,
  type ArtistProfileAttributesError,
} from "../../../domain/artistProfiles/factories";
import type { ArtistWriteCapabilities } from "../../capabilities";
import { loadOrDraftMyProfile } from "../loadOrDraftMyProfile";
import { persistMyProfile } from "../persistMyProfile";
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

  const profile = await loadOrDraftMyProfile(caps);
  const saved = await persistMyProfile(
    caps,
    profile.reviseAttributes(attributes.value),
  );

  return ok({ attributes: saved.toView().attributes });
};
