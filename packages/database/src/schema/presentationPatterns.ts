import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const presentationPatternsTable = pgTable("presentation_patterns", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  label: varchar("label", { length: 100 }).notNull(),
});

export const presentationPatternSelectSchema = createSelectSchema(
  presentationPatternsTable,
);
export const presentationPatternInsertSchema = createInsertSchema(
  presentationPatternsTable,
);
