import {
  pgTable,
  uuid,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { isNull, sql } from "drizzle-orm";
import {
  createInsertSchema,
  createSelectSchema,
} from "drizzle-zod";
import { artistProfilesTable } from "./artistProfiles";
import { artistStatusMastersTable } from "./artistStatusMasters";
import { usersTable } from "./users";

export const artistStatusesTable = pgTable(
  "artist_statuses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    artistProfileId: uuid("artist_profile_id")
      .notNull()
      .references(() => artistProfilesTable.id),
    artistStatusMasterId: integer("artist_status_master_id")
      .notNull()
      .references(() => artistStatusMastersTable.id),
    changedByUserId: uuid("changed_by_user_id")
      .notNull()
      .references(() => usersTable.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    uniqueIndex("artist_statuses_active_unique")
      .on(table.artistProfileId)
      .where(isNull(table.deletedAt)),
  ]
);

export const artistStatusSelectSchema = createSelectSchema(artistStatusesTable);
export const artistStatusInsertSchema = createInsertSchema(artistStatusesTable);
