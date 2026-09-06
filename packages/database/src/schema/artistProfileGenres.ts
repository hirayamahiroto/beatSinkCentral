import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { artistProfilesTable } from "./artistProfiles";

export const artistProfileGenresTable = pgTable("artist_profile_genres", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistProfileId: uuid("artist_profile_id")
    .notNull()
    .references(() => artistProfilesTable.id),
  genre: varchar("genre", { length: 100 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
