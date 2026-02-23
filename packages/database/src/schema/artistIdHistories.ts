import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
} from "drizzle-zod";
import { artistsTable } from "./artists";
import { usersTable } from "./users";

export const artistIdHistoriesTable = pgTable("artist_id_histories", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artistsTable.id),
  oldArtistId: varchar("old_artist_id", { length: 255 }).notNull(),
  newArtistId: varchar("new_artist_id", { length: 255 }).notNull(),
  changedByUserId: uuid("changed_by_user_id")
    .notNull()
    .references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const artistIdHistorySelectSchema = createSelectSchema(artistIdHistoriesTable);
export const artistIdHistoryInsertSchema = createInsertSchema(artistIdHistoriesTable);
