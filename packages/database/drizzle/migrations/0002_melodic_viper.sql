CREATE TABLE "artist_profile_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_profile_id" uuid NOT NULL,
	"link_type_id" integer NOT NULL,
	"url" text NOT NULL,
	"label" varchar(100),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	CONSTRAINT "link_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "artist_profile_links" ADD CONSTRAINT "artist_profile_links_artist_profile_id_artist_profiles_id_fk" FOREIGN KEY ("artist_profile_id") REFERENCES "public"."artist_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_profile_links" ADD CONSTRAINT "artist_profile_links_link_type_id_link_types_id_fk" FOREIGN KEY ("link_type_id") REFERENCES "public"."link_types"("id") ON DELETE no action ON UPDATE no action;