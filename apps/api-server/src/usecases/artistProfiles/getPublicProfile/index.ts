import type { ArtistProfileView } from "../../../domain/artistProfiles/entities";
import {
  createArtistProfileNotFoundError,
  type ArtistProfileNotFoundError,
} from "../../../domain/artistProfiles/errors/artistProfileNotFound";
import { defineUsecase } from "../../shared/defineUsecase";
import type { PublicReadCapabilities } from "../../capabilities";
import { type Result, ok, err } from "../../../utils/result";

export type GetPublicProfileInput = {
  accountId: string;
};

export type GetPublicProfileOutput = {
  accountId: string;
  profile: ArtistProfileView;
};

export type GetPublicProfileError = ArtistProfileNotFoundError;

type GetPublicProfileCaps = Pick<PublicReadCapabilities, "artistProfiles">;

export const getPublicProfile = defineUsecase<
  GetPublicProfileCaps,
  Result<GetPublicProfileOutput, GetPublicProfileError>,
  GetPublicProfileInput
>(async (caps, input) => {
  const profile = await caps.artistProfiles.findPublishedByAccountId(
    input.accountId,
  );
  if (!profile) return err(createArtistProfileNotFoundError());

  return ok({
    accountId: input.accountId,
    profile: profile.toView(),
  });
});
