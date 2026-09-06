import {
  pgTable,
  uuid,
  integer,
  text,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { artistProfilesTable } from "./artistProfiles";
import { linkTypesTable } from "./linkTypes";

export const artistProfileLinksTable = pgTable("artist_profile_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistProfileId: uuid("artist_profile_id")
    .notNull()
    .references(() => artistProfilesTable.id),
  linkTypeId: integer("link_type_id")
    .notNull()
    .references(() => linkTypesTable.id),
  url: text("url").notNull(),
  label: varchar("label", { length: 100 }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
