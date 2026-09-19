import type { ProfileLinkData } from "../../../domain/artistProfiles/entities";
import { createProfileLinks } from "../../../domain/artistProfiles/factories";
import type {
  CreateProfileLinkError,
  ProfileLinkInput,
} from "../../../domain/artistProfiles/valueObjects/profileLink";
import type { ArtistWriteCapabilities } from "../../capabilities";
import { loadOrDraftMyProfile } from "../loadOrDraftMyProfile";
import { persistMyProfile } from "../persistMyProfile";
import { type Result, ok } from "../../../utils/result";

export type ReplaceMyLinksInput = {
  links: ProfileLinkInput[];
};

export type ReplaceMyLinksOutput = {
  links: ProfileLinkData[];
};

export type ReplaceMyLinksError = CreateProfileLinkError;

type ReplaceMyLinksCaps = Pick<
  ArtistWriteCapabilities,
  "actor" | "artistProfiles"
>;

export const replaceMyLinks = async (
  caps: ReplaceMyLinksCaps,
  input: ReplaceMyLinksInput,
): Promise<Result<ReplaceMyLinksOutput, ReplaceMyLinksError>> => {
  const links = createProfileLinks(input.links);
  if (!links.ok) return links;

  const profile = await loadOrDraftMyProfile(caps);
  const saved = await persistMyProfile(caps, profile.replaceLinks(links.value));

  return ok({ links: saved.getLinks() });
};
