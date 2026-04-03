-- NOTE: このファイルはsupabase startでは実行されない（テーブル未作成のため）
-- npm run db:seed (src/seed.ts経由) で db:migrate 後に実行される

INSERT INTO "artist_status_masters" ("status_code", "status_name", "description") VALUES
  ('draft', '下書き', '非公開状態。アーティストプロフィール作成直後のデフォルト状態。'),
  ('published', '公開中', '公開状態。一般ユーザーから閲覧可能。')
ON CONFLICT ("status_code") DO NOTHING;
