import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { artistsTable } from "./artists";
import { presentationPatternsTable } from "./presentationPatterns";

export const artistProfilesTable = pgTable("artist_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .unique()
    .references(() => artistsTable.id),
  name: varchar("name", { length: 255 }),
  tagline: varchar("tagline", { length: 255 }),
  imageUrl: text("image_url"),
  activityInfo: varchar("activity_info", { length: 1000 }),
  presentationPatternId: integer("presentation_pattern_id").references(
    () => presentationPatternsTable.id,
  ),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});
