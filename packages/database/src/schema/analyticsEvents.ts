import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { artistsTable } from "./artists";

export const analyticsEventsTable = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    artistId: uuid("artist_id").references(() => artistsTable.id),
    anonId: uuid("anon_id").notNull(),
    sessionId: uuid("session_id").notNull(),
    path: varchar("path", { length: 2048 }).notNull(),
    referrer: varchar("referrer", { length: 2048 }),
    from: varchar("from", { length: 50 }),
    props: jsonb("props").$type<Record<string, unknown>>(),
    occurredAt: timestamp("occurred_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("analytics_events_artist_event_occurred_idx").on(
      table.artistId,
      table.eventType,
      table.occurredAt,
    ),
    index("analytics_events_session_idx").on(table.sessionId),
  ],
);
