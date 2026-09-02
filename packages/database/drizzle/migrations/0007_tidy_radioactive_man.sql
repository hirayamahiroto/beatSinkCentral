CREATE TABLE IF NOT EXISTS "story_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"label" varchar(200) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "story_questions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
-- 後続の story → story_chapters データ移行がこのマイグレーション内で story_question_id を参照するため、seed.sql ではなくここで投入する
INSERT INTO "story_questions" ("code", "label", "sort_order") VALUES
	('beginning', '始まり', 0),
	('turning_point', '転機', 1),
	('concept', '何を表現したいのか', 2)
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "story_chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_profile_id" uuid NOT NULL,
	"story_question_id" integer NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- NOTE: 本migrationは旧採番（0006_round_firestar）でPreview DBへ部分適用済みの状態でも
-- 再実行できるよう、テーブル作成・制約追加・カラム削除を冪等化している
DO $$ BEGIN
	ALTER TABLE "story_chapters" ADD CONSTRAINT "story_chapters_artist_profile_id_artist_profiles_id_fk" FOREIGN KEY ("artist_profile_id") REFERENCES "public"."artist_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "story_chapters" ADD CONSTRAINT "story_chapters_story_question_id_story_questions_id_fk" FOREIGN KEY ("story_question_id") REFERENCES "public"."story_questions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "story_chapters_profile_question_idx" ON "story_chapters" USING btree ("artist_profile_id","story_question_id");
--> statement-breakpoint
-- 既存の自由記述 story を「始まり」章として移行してからカラムを落とす（データを失わない）。
-- story カラムが既に削除済み（本migrationの部分適用済み環境）ならこのブロックはスキップされる
DO $$ BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'artist_profiles' AND column_name = 'story'
	) THEN
		INSERT INTO "story_chapters" ("artist_profile_id", "story_question_id", "body")
		SELECT "artist_profiles"."id", "story_questions"."id", "artist_profiles"."story"
		FROM "artist_profiles"
		CROSS JOIN "story_questions"
		WHERE "story_questions"."code" = 'beginning'
			AND "artist_profiles"."story" IS NOT NULL
			AND btrim("artist_profiles"."story") <> ''
		ON CONFLICT ("artist_profile_id", "story_question_id") DO NOTHING;
	END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "artist_profiles" DROP COLUMN IF EXISTS "story";
