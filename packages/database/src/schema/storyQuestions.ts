import { pgTable, serial, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const storyQuestionsTable = pgTable("story_questions", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  label: varchar("label", { length: 200 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const storyQuestionSelectSchema =
  createSelectSchema(storyQuestionsTable);
export const storyQuestionInsertSchema =
  createInsertSchema(storyQuestionsTable);
