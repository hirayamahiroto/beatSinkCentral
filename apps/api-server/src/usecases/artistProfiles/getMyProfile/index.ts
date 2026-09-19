import type { ArtistProfileView } from "../../../domain/artistProfiles/entities";
import {
  assessPublishability,
  type Publishability,
} from "../../../domain/artistProfiles/policies/publishability";
import type { ArtistReadCapabilities } from "../../capabilities";
import { type Result, ok } from "../../../utils/result";

export type GetMyProfileOutput = {
  handle: string;
  profile: ArtistProfileView | null;
  publishability: Publishability | null;
};

type GetMyProfileCaps = Pick<
  ArtistReadCapabilities,
  "actor" | "artistProfiles"
>;

export const getMyProfile = async (
  caps: GetMyProfileCaps,
): Promise<Result<GetMyProfileOutput, never>> => {
  const profile = await caps.artistProfiles.findByArtistId(
    caps.actor.artist.getArtistId(),
  );

  return ok({
    handle: caps.actor.artist.getHandle(),
    profile: profile ? profile.toView() : null,
    publishability: profile ? assessPublishability(profile) : null,
  });
};
