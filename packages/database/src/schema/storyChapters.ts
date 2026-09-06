import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { artistProfilesTable } from "./artistProfiles";
import { storyQuestionsTable } from "./storyQuestions";

export const storyChaptersTable = pgTable(
  "story_chapters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    artistProfileId: uuid("artist_profile_id")
      .notNull()
      .references(() => artistProfilesTable.id),
    storyQuestionId: integer("story_question_id")
      .notNull()
      .references(() => storyQuestionsTable.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("story_chapters_profile_question_idx").on(
      table.artistProfileId,
      table.storyQuestionId,
    ),
  ],
);

export const storyChapterSelectSchema = createSelectSchema(storyChaptersTable);
export const storyChapterInsertSchema = createInsertSchema(storyChaptersTable);
