import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { artistsTable } from "./artists";

export const performanceHistoriesTable = pgTable("performance_histories", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artistsTable.id),
  eventId: uuid("event_id"),
  performanceType: varchar("performance_type", { length: 100 }).notNull(),
  result: text("result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const performanceHistorySelectSchema = createSelectSchema(
  performanceHistoriesTable
);
export const performanceHistoryInsertSchema = createInsertSchema(
  performanceHistoriesTable
);
