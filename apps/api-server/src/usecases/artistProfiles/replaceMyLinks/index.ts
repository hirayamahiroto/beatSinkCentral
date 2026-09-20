import type { ProfileLinkData } from "../../../domain/artistProfiles/entities";
import { createProfileLinks } from "../../../domain/artistProfiles/factories";
import type {
  CreateProfileLinkError,
  ProfileLinkInput,
} from "../../../domain/artistProfiles/valueObjects/profileLink";
import { replaceLinks, toView } from "../../../domain/artistProfiles/behaviors";
import { edit } from "../../../domain/artistProfiles/policies/publishability";
import type { ArtistWriteCapabilities } from "../../../capabilities";
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

  const state = await caps.artistProfiles.load(caps.actor.artist.getArtistId());
  const saved = await caps.artistProfiles.save(
    edit(state, (content) => replaceLinks(content, links.value)),
  );

  return ok({ links: toView(saved).links });
};
