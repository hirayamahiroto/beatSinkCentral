import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
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
  name: varchar("name", { length: 255 }),
  tagline: varchar("tagline", { length: 255 }),
  imageUrl: text("image_url"),
  story: text("story"),
  activityInfo: varchar("activity_info", { length: 1000 }),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const artistProfileSelectSchema =
  createSelectSchema(artistProfilesTable);
export const artistProfileInsertSchema =
  createInsertSchema(artistProfilesTable);
export const artistProfileUpdateSchema =
  createUpdateSchema(artistProfilesTable);
