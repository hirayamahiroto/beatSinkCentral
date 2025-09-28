import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { artistProfilesTable } from "./artistProfiles";

export const artistProfileHistoriesTable = pgTable("artist_profile_histories", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => artistProfilesTable.id),
  changedFields: text("changed_fields").notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});

export const artistProfileHistorySelectSchema = createSelectSchema(
  artistProfileHistoriesTable
);
export const artistProfileHistoryInsertSchema = createInsertSchema(
  artistProfileHistoriesTable
);
