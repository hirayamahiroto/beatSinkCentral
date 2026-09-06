import { pgTable, serial, varchar, integer } from "drizzle-orm/pg-core";

export const storyQuestionsTable = pgTable("story_questions", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  label: varchar("label", { length: 200 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});
