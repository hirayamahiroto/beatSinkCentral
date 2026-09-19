CREATE TABLE "presentation_patterns" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	CONSTRAINT "presentation_patterns_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "artist_profiles" ADD COLUMN "presentation_pattern_id" integer;--> statement-breakpoint
ALTER TABLE "artist_profiles" ADD CONSTRAINT "artist_profiles_presentation_pattern_id_presentation_patterns_id_fk" FOREIGN KEY ("presentation_pattern_id") REFERENCES "public"."presentation_patterns"("id") ON DELETE no action ON UPDATE no action;