import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
} from "drizzle-zod";
import { artistProfilesTable } from "./artistProfiles";
import { usersTable } from "./users";

export const artistIdHistoriesTable = pgTable("artist_id_histories", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistProfileId: uuid("artist_profile_id")
    .notNull()
    .references(() => artistProfilesTable.id),
  oldArtistId: varchar("old_artist_id", { length: 255 }).notNull(),
  newArtistId: varchar("new_artist_id", { length: 255 }).notNull(),
  changedByUserId: uuid("changed_by_user_id")
    .notNull()
    .references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const artistIdHistorySelectSchema = createSelectSchema(artistIdHistoriesTable);
export const artistIdHistoryInsertSchema = createInsertSchema(artistIdHistoriesTable);
