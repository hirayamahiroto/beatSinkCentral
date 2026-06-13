CREATE TABLE "artist_profile_genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_profile_id" uuid NOT NULL,
	"genre" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artist_profile_sns_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_profile_id" uuid NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "artist_profiles" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "artist_profiles" ADD COLUMN "tagline" varchar(255);--> statement-breakpoint
ALTER TABLE "artist_profiles" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "artist_profiles" ADD COLUMN "story" text;--> statement-breakpoint
ALTER TABLE "artist_profiles" ADD COLUMN "activity_info" varchar(1000);--> statement-breakpoint
ALTER TABLE "artist_profiles" ADD COLUMN "published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "artist_profiles" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "artist_profile_genres" ADD CONSTRAINT "artist_profile_genres_artist_profile_id_artist_profiles_id_fk" FOREIGN KEY ("artist_profile_id") REFERENCES "public"."artist_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_profile_sns_links" ADD CONSTRAINT "artist_profile_sns_links_artist_profile_id_artist_profiles_id_fk" FOREIGN KEY ("artist_profile_id") REFERENCES "public"."artist_profiles"("id") ON DELETE no action ON UPDATE no action;