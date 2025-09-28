import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const organizerProfilesTable = pgTable("organizer_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationName: varchar("organization_name", { length: 255 }).notNull(),
  contactInfo: text("contact_info"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const organizerProfileSelectSchema = createSelectSchema(
  organizerProfilesTable
);
export const organizerProfileInsertSchema = createInsertSchema(
  organizerProfilesTable
);
