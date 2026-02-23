import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { artistsTable } from "./artists";

export const artistProfilesTable = pgTable("artist_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .unique()
    .references(() => artistsTable.id),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const artistProfileSelectSchema = createSelectSchema(artistProfilesTable);
export const artistProfileInsertSchema = createInsertSchema(artistProfilesTable);
export const artistProfileUpdateSchema = createUpdateSchema(artistProfilesTable);
