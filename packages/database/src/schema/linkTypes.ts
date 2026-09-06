import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const linkTypesTable = pgTable("link_types", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  label: varchar("label", { length: 100 }).notNull(),
});

export const linkTypeSelectSchema = createSelectSchema(linkTypesTable);
export const linkTypeInsertSchema = createInsertSchema(linkTypesTable);
