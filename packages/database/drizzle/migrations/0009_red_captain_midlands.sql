CREATE TABLE "artist_handle_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"old_handle" varchar(255) NOT NULL,
	"new_handle" varchar(255) NOT NULL,
	"changed_by_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "artist_id_histories" CASCADE;--> statement-breakpoint
ALTER TABLE "artist_handle_histories" ADD CONSTRAINT "artist_handle_histories_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_handle_histories" ADD CONSTRAINT "artist_handle_histories_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;