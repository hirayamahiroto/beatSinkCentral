import type { ArtistProfileView } from "../../../domain/artistProfiles/entities";
import type { ArtistReadCapabilities } from "../../capabilities";
import { type Result, ok } from "../../../utils/result";

export type GetMyProfileOutput = {
  accountId: string;
  profile: ArtistProfileView | null;
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
    accountId: caps.actor.artist.getAccountId(),
    profile: profile ? profile.toView() : null,
  });
};
