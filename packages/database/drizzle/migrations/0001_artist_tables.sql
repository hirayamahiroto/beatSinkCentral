CREATE TABLE "artist_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"artist_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artist_profiles_artist_id_unique" UNIQUE("artist_id")
);

CREATE TABLE "artist_status_masters" (
	"id" serial PRIMARY KEY NOT NULL,
	"status_code" varchar(50) NOT NULL,
	"status_name" varchar(100) NOT NULL,
	"description" text,
	CONSTRAINT "artist_status_masters_status_code_unique" UNIQUE("status_code")
);

CREATE TABLE "artist_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_profile_id" uuid NOT NULL,
	"artist_status_master_id" integer NOT NULL,
	"changed_by_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "artist_id_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_profile_id" uuid NOT NULL,
	"old_artist_id" varchar(255) NOT NULL,
	"new_artist_id" varchar(255) NOT NULL,
	"changed_by_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "artist_profiles" ADD CONSTRAINT "artist_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "artist_statuses" ADD CONSTRAINT "artist_statuses_artist_profile_id_artist_profiles_id_fk" FOREIGN KEY ("artist_profile_id") REFERENCES "public"."artist_profiles"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "artist_statuses" ADD CONSTRAINT "artist_statuses_artist_status_master_id_artist_status_masters_id_fk" FOREIGN KEY ("artist_status_master_id") REFERENCES "public"."artist_status_masters"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "artist_statuses" ADD CONSTRAINT "artist_statuses_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "artist_id_histories" ADD CONSTRAINT "artist_id_histories_artist_profile_id_artist_profiles_id_fk" FOREIGN KEY ("artist_profile_id") REFERENCES "public"."artist_profiles"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "artist_id_histories" ADD CONSTRAINT "artist_id_histories_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
