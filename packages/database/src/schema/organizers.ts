import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { usersTable } from "./users";
import { organizerProfilesTable } from "./organizerProfiles";

export const organizersTable = pgTable("organizers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => organizerProfilesTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const organizerSelectSchema = createSelectSchema(organizersTable);
export const organizerInsertSchema = createInsertSchema(organizersTable);
