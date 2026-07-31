import type { ArtistProfileView } from "../../../domain/artistProfiles/entities";
import { defineUsecase } from "../../shared/defineUsecase";
import type { ReadCapabilities } from "../../capabilities";
import { type Result, ok } from "../../../utils/result";

export type GetMyProfileOutput = {
  accountId: string;
  profile: ArtistProfileView | null;
};

type GetMyProfileCaps = Pick<ReadCapabilities, "actor" | "artistProfiles">;

export const getMyProfile = defineUsecase<
  GetMyProfileCaps,
  Result<GetMyProfileOutput, never>
>(async (caps) => {
  const profile = await caps.artistProfiles.findByArtistId(
    caps.actor.artist.getArtistId(),
  );

  return ok({
    accountId: caps.actor.artist.getAccountId(),
    profile: profile ? profile.toView() : null,
  });
});
