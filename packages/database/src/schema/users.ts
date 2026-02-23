import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  subId: varchar("sub_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSelectSchema = createSelectSchema(usersTable);
export const userInsertSchema = createInsertSchema(usersTable);
export const userUpdateSchema = createUpdateSchema(usersTable);
