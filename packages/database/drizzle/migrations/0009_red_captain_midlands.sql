-- NOTE: 本migrationは旧採番（0009_breezy_maddog: index 付き）でPreview DBへ適用済みの状態でも
-- 再実行できるよう、テーブル作成・旧テーブル削除・制約追加・index削除を冪等化している
CREATE TABLE IF NOT EXISTS "artist_handle_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"old_handle" varchar(255) NOT NULL,
	"new_handle" varchar(255) NOT NULL,
	"changed_by_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE IF EXISTS "artist_id_histories" CASCADE;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "artist_handle_histories" ADD CONSTRAINT "artist_handle_histories_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "artist_handle_histories" ADD CONSTRAINT "artist_handle_histories_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DROP INDEX IF EXISTS "artist_handle_histories_artist_created_idx";
