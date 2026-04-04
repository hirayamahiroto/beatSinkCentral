import { pgTable, uuid, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
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
      table.artistId
    ),
  ]
);

export const artistOwnerSelectSchema = createSelectSchema(artistOwnersTable);
export const artistOwnerInsertSchema = createInsertSchema(artistOwnersTable);
export const artistOwnerUpdateSchema = createUpdateSchema(artistOwnersTable);
