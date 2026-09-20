-- config.toml の [db.seed] を無効化しているため、Supabase CLI（start / db reset）はこのファイルを実行しない。
-- テーブルは Drizzle が作るので、npm run db:migrate の後に npm run db:seed（src/seed.ts）で投入する。

INSERT INTO "artist_status_masters" ("status_code", "status_name", "description") VALUES
  ('draft', '下書き', '非公開状態。アーティストプロフィール作成直後のデフォルト状態。'),
  ('published', '公開中', '公開状態。一般ユーザーから閲覧可能。')
ON CONFLICT ("status_code") DO NOTHING;

INSERT INTO "link_types" ("code", "label") VALUES
  ('youtube', 'YouTube'),
  ('x', 'X'),
  ('instagram', 'Instagram'),
  ('tiktok', 'TikTok'),
  ('other', 'その他')
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "presentation_patterns" ("code", "label") VALUES
  ('interview', 'インタビュー'),
  ('zoom_dive', 'ズーム'),
  ('spotlight', 'スポットライト'),
  ('editorial', '特集記事')
ON CONFLICT ("code") DO NOTHING;
