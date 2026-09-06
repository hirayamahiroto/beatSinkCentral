import type { Offer } from "../../../domain/offers/entities";
import { isOfferActiveAt } from "../../../domain/offers/policies/activity";
import type { ArtistReadCapabilities } from "../../capabilities";

type FindMyActiveOfferCaps = Pick<ArtistReadCapabilities, "actor" | "offers">;

export const findMyActiveOffer = async (
  caps: FindMyActiveOfferCaps,
): Promise<Offer | null> => {
  const latest = await caps.offers.findLatestByArtistId(
    caps.actor.artist.getArtistId(),
  );
  return latest !== null && isOfferActiveAt(latest, new Date()) ? latest : null;
};
