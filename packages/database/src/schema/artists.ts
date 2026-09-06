import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const artistsTable = pgTable("artists", {
  id: uuid("id").primaryKey().defaultRandom(),
  handle: varchar("handle", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
