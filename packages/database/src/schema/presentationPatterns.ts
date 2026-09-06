import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const presentationPatternsTable = pgTable("presentation_patterns", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  label: varchar("label", { length: 100 }).notNull(),
});
