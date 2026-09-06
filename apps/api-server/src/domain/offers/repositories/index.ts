import type { Offer, OfferPersistenceData } from "../entities";

export interface IOfferReader {
  findLatestByArtistId(artistId: string): Promise<Offer | null>;
}

export interface IOfferWriter {
  upsert(data: OfferPersistenceData): Promise<void>;
}
