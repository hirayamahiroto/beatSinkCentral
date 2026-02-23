import { pgTable, serial, varchar, text } from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
} from "drizzle-zod";

export const artistStatusMastersTable = pgTable("artist_status_masters", {
  id: serial("id").primaryKey(),
  statusCode: varchar("status_code", { length: 50 }).notNull().unique(),
  statusName: varchar("status_name", { length: 100 }).notNull(),
  description: text("description"),
});

export const artistStatusMasterSelectSchema = createSelectSchema(artistStatusMastersTable);
export const artistStatusMasterInsertSchema = createInsertSchema(artistStatusMastersTable);
