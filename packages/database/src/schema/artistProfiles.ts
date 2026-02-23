import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { usersTable } from "./users";

export const artistProfilesTable = pgTable("artist_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  artistId: varchar("artist_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const artistProfileSelectSchema = createSelectSchema(artistProfilesTable);
export const artistProfileInsertSchema = createInsertSchema(artistProfilesTable);
export const artistProfileUpdateSchema = createUpdateSchema(artistProfilesTable);
