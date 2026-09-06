import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { artistsTable } from "./artists";
import { offersTable } from "./offers";

export const offerPerformersTable = pgTable(
  "offer_performers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offersTable.id),
    artistId: uuid("artist_id").references(() => artistsTable.id),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("offer_performers_offer_idx").on(table.offerId)],
);
