import { asc, desc, eq } from "drizzle-orm";
import {
  artistsTable,
  offersTable,
  offerPerformersTable,
} from "../../../../../../packages/database/src/utils/createClient";
import type {
  IOfferReader,
  IOfferWriter,
} from "../../../domain/offers/repositories";
import type {
  Offer,
  OfferPersistenceData,
} from "../../../domain/offers/entities";
import { reconstructOffer } from "../../../domain/offers/factories";
import type { CoPerformerInput } from "../../../domain/offers/valueObjects/coPerformer";
import type { Executor } from "../../transaction";

const offerColumns = {
  id: offersTable.id,
  artistId: offersTable.artistId,
  date: offersTable.heldOn,
  place: offersTable.place,
  ticketUrl: offersTable.ticketUrl,
  comment: offersTable.comment,
};

type CoPerformerRow = {
  name: string;
  artistId: string | null;
  handle: string | null;
};

const toCoPerformerInputs = (rows: CoPerformerRow[]): CoPerformerInput[] =>
  rows.map((row) => ({
    name: row.name,
    artist:
      row.artistId !== null && row.handle !== null
        ? { artistId: row.artistId, handle: row.handle }
        : null,
  }));

const loadCoPerformers = (
  executor: Executor,
  offerId: string,
): Promise<CoPerformerRow[]> =>
  executor
    .select({
      name: offerPerformersTable.displayName,
      artistId: offerPerformersTable.artistId,
      handle: artistsTable.handle,
    })
    .from(offerPerformersTable)
    .leftJoin(artistsTable, eq(offerPerformersTable.artistId, artistsTable.id))
    .where(eq(offerPerformersTable.offerId, offerId))
    .orderBy(asc(offerPerformersTable.sortOrder));

export const createOfferReader = (executor: Executor): IOfferReader => ({
  async findLatestByArtistId(artistId: string): Promise<Offer | null> {
    const [row] = await executor
      .select(offerColumns)
      .from(offersTable)
      .where(eq(offersTable.artistId, artistId))
      .orderBy(desc(offersTable.createdAt), desc(offersTable.id))
      .limit(1);
    if (!row) return null;

    const coPerformers = await loadCoPerformers(executor, row.id);
    return reconstructOffer({
      ...row,
      coPerformers: toCoPerformerInputs(coPerformers),
    });
  },
});

export const createOfferWriter = (executor: Executor): IOfferWriter => ({
  async upsert(data: OfferPersistenceData): Promise<void> {
    const [written] = await executor
      .insert(offersTable)
      .values({
        id: data.id,
        artistId: data.artistId,
        heldOn: data.date,
        place: data.place,
        ticketUrl: data.ticketUrl,
        comment: data.comment,
      })
      .onConflictDoUpdate({
        target: offersTable.id,
        set: {
          heldOn: data.date,
          place: data.place,
          ticketUrl: data.ticketUrl,
          comment: data.comment,
          updatedAt: new Date(),
        },
        setWhere: eq(offersTable.artistId, data.artistId),
      })
      .returning({ id: offersTable.id });
    if (!written) {
      throw new Error("upsert: offer does not belong to the artist");
    }

    await executor
      .delete(offerPerformersTable)
      .where(eq(offerPerformersTable.offerId, written.id));

    if (data.coPerformers.length > 0) {
      await executor.insert(offerPerformersTable).values(
        data.coPerformers.map((coPerformer, index) => ({
          offerId: written.id,
          artistId: coPerformer.artistId,
          displayName: coPerformer.name,
          sortOrder: index,
        })),
      );
    }
  },
});
