import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { artistsTable } from "./artists";

export const offersTable = pgTable(
  "offers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artistsTable.id),
    heldOn: date("held_on", { mode: "string" }).notNull(),
    place: varchar("place", { length: 255 }).notNull(),
    ticketUrl: text("ticket_url").notNull(),
    comment: varchar("comment", { length: 500 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("offers_artist_created_idx").on(table.artistId, table.createdAt),
  ],
);
