import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";

export const artistsTable = pgTable("artists", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: varchar("account_id", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const artistSelectSchema = createSelectSchema(artistsTable);
export const artistInsertSchema = createInsertSchema(artistsTable);
export const artistUpdateSchema = createUpdateSchema(artistsTable);
