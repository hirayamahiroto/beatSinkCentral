import {
  pgTable,
  uuid,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { isNull } from "drizzle-orm";
import { artistsTable } from "./artists";
import { artistStatusMastersTable } from "./artistStatusMasters";
import { usersTable } from "./users";

/** @public drizzle-kit がマイグレーション生成で参照する（アプリからの参照はまだ無い） */
export const artistStatusesTable = pgTable(
  "artist_statuses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artistsTable.id),
    artistStatusMasterId: integer("artist_status_master_id")
      .notNull()
      .references(() => artistStatusMastersTable.id),
    changedByUserId: uuid("changed_by_user_id")
      .notNull()
      .references(() => usersTable.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    revokedAt: timestamp("revoked_at"),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    uniqueIndex("artist_statuses_active_unique")
      .on(table.artistId)
      .where(isNull(table.deletedAt)),
  ],
);
