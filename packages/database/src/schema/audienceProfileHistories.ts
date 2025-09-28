import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { audienceProfilesTable } from "./audienceProfiles";

export const audienceProfileHistoriesTable = pgTable(
  "audience_profile_histories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => audienceProfilesTable.id),
    changedFields: text("changed_fields").notNull(),
    changedAt: timestamp("changed_at").defaultNow().notNull(),
  }
);

export const audienceProfileHistorySelectSchema = createSelectSchema(
  audienceProfileHistoriesTable
);
export const audienceProfileHistoryInsertSchema = createInsertSchema(
  audienceProfileHistoriesTable
);
