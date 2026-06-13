import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { artistProfilesTable } from "./artistProfiles";

export const artistProfileSnsLinksTable = pgTable(
  "artist_profile_sns_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    artistProfileId: uuid("artist_profile_id")
      .notNull()
      .references(() => artistProfilesTable.id),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
);

export const artistProfileSnsLinkSelectSchema = createSelectSchema(
  artistProfileSnsLinksTable,
);
export const artistProfileSnsLinkInsertSchema = createInsertSchema(
  artistProfileSnsLinksTable,
);
