import type { ArtistProfile } from "../../../domain/artistProfiles/entities";
import { createDraftArtistProfile } from "../../../domain/artistProfiles/factories";
import type { ArtistWriteCapabilities } from "../../capabilities";

type LoadOrDraftMyProfileCaps = Pick<
  ArtistWriteCapabilities,
  "actor" | "artistProfiles"
>;

export const loadOrDraftMyProfile = async (
  caps: LoadOrDraftMyProfileCaps,
): Promise<ArtistProfile> => {
  const artistId = caps.actor.artist.getArtistId();
  const existing = await caps.artistProfiles.findByArtistId(artistId);
  return existing ?? createDraftArtistProfile({ artistId });
};
