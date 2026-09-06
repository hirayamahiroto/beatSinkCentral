import { pgTable, uuid, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { artistsTable } from "./artists";

/** @public drizzle-kit がマイグレーション生成で参照する（アプリからの参照はまだ無い） */
export const artistMembersTable = pgTable(
  "artist_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artistsTable.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => usersTable.id),
    invitedAt: timestamp("invited_at").defaultNow().notNull(),
    acceptedAt: timestamp("accepted_at"),
  },
  (table) => [
    uniqueIndex("artist_members_artist_user_idx").on(
      table.artistId,
      table.userId,
    ),
  ],
);
