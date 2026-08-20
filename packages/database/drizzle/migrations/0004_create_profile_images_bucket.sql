-- Custom SQL migration file, put your code below! --

-- Supabase Storage のバケットは同一 Postgres 内の storage.buckets テーブルで管理されるため、
-- drizzle マイグレーションを SoT としてバケットを宣言する（config.toml には定義しない）。
-- 書き込みは api-server の service role のみ。anon 向けの storage.objects ポリシーは作成しない。
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
	'profile-images',
	'profile-images',
	true,
	5242880,
	ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
	public = EXCLUDED.public,
	file_size_limit = EXCLUDED.file_size_limit,
	allowed_mime_types = EXCLUDED.allowed_mime_types;
