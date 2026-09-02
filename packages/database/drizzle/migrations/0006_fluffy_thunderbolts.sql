CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"artist_id" uuid,
	"anon_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"path" varchar(2048) NOT NULL,
	"referrer" varchar(2048),
	"from" varchar(50),
	"props" jsonb,
	"occurred_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_events_artist_event_occurred_idx" ON "analytics_events" USING btree ("artist_id","event_type","occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_events_session_idx" ON "analytics_events" USING btree ("session_id");