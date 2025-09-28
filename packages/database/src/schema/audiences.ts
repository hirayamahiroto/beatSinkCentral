import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { usersTable } from "./users";
import { audienceProfilesTable } from "./audienceProfiles";

export const audiencesTable = pgTable("audiences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => audienceProfilesTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const audienceSelectSchema = createSelectSchema(audiencesTable);
export const audienceInsertSchema = createInsertSchema(audiencesTable);
