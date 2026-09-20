import type {
  ArtistProfileView,
  ProfileState,
} from "../../../domain/artistProfiles/entities";
import { toView } from "../../../domain/artistProfiles/behaviors";
import {
  assessPublishability,
  type Publishability,
} from "../../../domain/artistProfiles/policies/publishability";
import type { OfferView } from "../../../domain/offers/entities";
import type { ArtistReadCapabilities } from "../../../capabilities";
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

type ProfileOutput = Pick<GetMyProfileOutput, "profile" | "publishability">;

const toProfileOutput = (state: ProfileState): ProfileOutput => {
  switch (state.kind) {
    case "noProfile":
      return { profile: null, publishability: null };

    case "draft":
      return {
        profile: toView(state),
        publishability: assessPublishability(state.content),
      };

    case "published":
      return {
        profile: toView(state),
        publishability: { ok: true, missingFields: [] },
      };
  }
};

export const getMyProfile = async (
  caps: GetMyProfileCaps,
): Promise<Result<GetMyProfileOutput, never>> => {
  const [state, offer] = await Promise.all([
    caps.artistProfiles.load(caps.actor.artist.getArtistId()),
    findMyActiveOffer(caps),
  ]);

  return ok({
    handle: caps.actor.artist.getHandle(),
    ...toProfileOutput(state),
    offer: offer ? offer.toView() : null,
  });
};
