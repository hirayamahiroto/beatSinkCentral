import { pgTable, uuid, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { artistsTable } from "./artists";

export const artistOwnersTable = pgTable(
  "artist_owners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artistsTable.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("artist_owners_user_artist_idx").on(
      table.userId,
      table.artistId,
    ),
  ],
);
