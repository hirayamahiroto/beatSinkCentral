import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { usersTable } from "./users";
import { artistsTable } from "./artists";

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

export const artistMemberSelectSchema = createSelectSchema(artistMembersTable);
export const artistMemberInsertSchema = createInsertSchema(artistMembersTable);
export const artistMemberUpdateSchema = createUpdateSchema(artistMembersTable);
