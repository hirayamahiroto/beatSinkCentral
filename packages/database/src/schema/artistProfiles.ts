import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { artistsTable } from "./artists";

// プロフィールは「下書き保存可・公開時に最小核を検証」する設計のため、
// 本文系カラムは nullable（書きかけを保持できる）。published の可否は
// アプリ層の publish ポリシーで判定する（profile-information-design.md §4）。
export const artistProfilesTable = pgTable("artist_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .unique()
    .references(() => artistsTable.id),
  name: varchar("name", { length: 255 }),
  tagline: varchar("tagline", { length: 255 }),
  imageUrl: text("image_url"),
  story: text("story"),
  activityInfo: varchar("activity_info", { length: 1000 }),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const artistProfileSelectSchema =
  createSelectSchema(artistProfilesTable);
export const artistProfileInsertSchema =
  createInsertSchema(artistProfilesTable);
export const artistProfileUpdateSchema =
  createUpdateSchema(artistProfilesTable);
