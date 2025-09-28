import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { organizerProfilesTable } from "./organizerProfiles";

export const organizerProfileHistoriesTable = pgTable(
  "organizer_profile_histories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => organizerProfilesTable.id),
    changedFields: text("changed_fields").notNull(),
    changedAt: timestamp("changed_at").defaultNow().notNull(),
  }
);

export const organizerProfileHistorySelectSchema = createSelectSchema(
  organizerProfileHistoriesTable
);
export const organizerProfileHistoryInsertSchema = createInsertSchema(
  organizerProfileHistoriesTable
);
