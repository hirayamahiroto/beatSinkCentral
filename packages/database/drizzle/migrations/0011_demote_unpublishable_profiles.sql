-- 公開後の編集で必須項目（名前・写真・始まりの章・ジャンル・リンク）を欠いたまま公開状態に残っている行を下書きへ降ろす。
-- 以降は domain の edit が条件を割った時点で下書きへ降ろすため、この移行は既存行に対する一回限りの是正。
UPDATE "artist_profiles" AS p
SET "published" = false,
	"published_at" = NULL,
	"updated_at" = now()
WHERE p."published" = true
	AND (
		p."name" IS NULL OR btrim(p."name") = ''
		OR p."image_url" IS NULL OR btrim(p."image_url") = ''
		OR NOT EXISTS (
			SELECT 1 FROM "artist_profile_genres" AS g
			WHERE g."artist_profile_id" = p."id"
		)
		OR NOT EXISTS (
			SELECT 1 FROM "artist_profile_links" AS l
			WHERE l."artist_profile_id" = p."id"
		)
		OR NOT EXISTS (
			SELECT 1 FROM "story_chapters" AS c
			INNER JOIN "story_questions" AS q ON q."id" = c."story_question_id"
			WHERE c."artist_profile_id" = p."id"
				AND q."code" = 'beginning'
				AND btrim(c."body") <> ''
		)
	);
