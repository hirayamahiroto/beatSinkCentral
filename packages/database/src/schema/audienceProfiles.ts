import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const audienceProfilesTable = pgTable("audience_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  fanName: varchar("name", { length: 255 }).notNull(),
  preferences: text("preferences"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const audienceProfileSelectSchema = createSelectSchema(
  audienceProfilesTable
);
export const audienceProfileInsertSchema = createInsertSchema(
  audienceProfilesTable
);
