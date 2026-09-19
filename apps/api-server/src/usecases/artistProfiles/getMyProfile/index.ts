import type { ArtistProfileView } from "../../../domain/artistProfiles/entities";
import {
  assessPublishability,
  type Publishability,
} from "../../../domain/artistProfiles/policies/publishability";
import type { OfferView } from "../../../domain/offers/entities";
import type { ArtistReadCapabilities } from "../../capabilities";
import { findMyActiveOffer } from "../../offers/findMyActiveOffer";
import { type Result, ok } from "../../../utils/result";

export type GetMyProfileOutput = {
  handle: string;
  profile: ArtistProfileView | null;
  publishability: Publishability | null;
  offer: OfferView | null;
};

type GetMyProfileCaps = Pick<
  ArtistReadCapabilities,
  "actor" | "artistProfiles" | "offers"
>;

export const getMyProfile = async (
  caps: GetMyProfileCaps,
): Promise<Result<GetMyProfileOutput, never>> => {
  const [profile, offer] = await Promise.all([
    caps.artistProfiles.findByArtistId(caps.actor.artist.getArtistId()),
    findMyActiveOffer(caps),
  ]);

  return ok({
    handle: caps.actor.artist.getHandle(),
    profile: profile ? profile.toView() : null,
    publishability: profile ? assessPublishability(profile) : null,
    offer: offer ? offer.toView() : null,
  });
};
