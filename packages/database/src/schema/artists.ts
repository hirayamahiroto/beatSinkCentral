import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { usersTable } from "./users";
import { artistProfilesTable } from "./artistProfiles";

export const artistsTable = pgTable("artists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => artistProfilesTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const artistSelectSchema = createSelectSchema(artistsTable);
export const artistInsertSchema = createInsertSchema(artistsTable);
