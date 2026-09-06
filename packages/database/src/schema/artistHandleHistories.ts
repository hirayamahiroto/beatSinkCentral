import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { artistsTable } from "./artists";
import { usersTable } from "./users";

export const artistHandleHistoriesTable = pgTable("artist_handle_histories", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artistsTable.id),
  oldHandle: varchar("old_handle", { length: 255 }).notNull(),
  newHandle: varchar("new_handle", { length: 255 }).notNull(),
  changedByUserId: uuid("changed_by_user_id")
    .notNull()
    .references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
