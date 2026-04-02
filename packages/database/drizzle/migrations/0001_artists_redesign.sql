-- artists テーブルのカラム変更: user_id/artist_id/deleted_at を削除し account_id を追加
ALTER TABLE "artists" DROP CONSTRAINT "artists_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "artists" DROP CONSTRAINT "artists_user_id_unique";--> statement-breakpoint
ALTER TABLE "artists" DROP CONSTRAINT "artists_artist_id_unique";--> statement-breakpoint
ALTER TABLE "artists" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "artists" DROP COLUMN "artist_id";--> statement-breakpoint
ALTER TABLE "artists" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "artists" ADD COLUMN "account_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_account_id_unique" UNIQUE("account_id");--> statement-breakpoint
CREATE TABLE "artist_owners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"artist_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "artist_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"invited_by" uuid NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp
);--> statement-breakpoint
ALTER TABLE "artist_owners" ADD CONSTRAINT "artist_owners_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_owners" ADD CONSTRAINT "artist_owners_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_members" ADD CONSTRAINT "artist_members_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_members" ADD CONSTRAINT "artist_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_members" ADD CONSTRAINT "artist_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "artist_owners_user_artist_idx" ON "artist_owners" USING btree ("user_id","artist_id");--> statement-breakpoint
CREATE UNIQUE INDEX "artist_members_artist_user_idx" ON "artist_members" USING btree ("artist_id","user_id");
