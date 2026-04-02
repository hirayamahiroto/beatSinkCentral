-- artist_status_masters seed data
INSERT INTO artist_status_masters (status_code, status_name, description) VALUES
  ('pending', '申請中', 'アーティスト登録の申請が行われ、承認待ちの状態'),
  ('active', '有効', 'アーティストとして有効に活動中の状態'),
  ('suspended', '停止中', '運営により一時的に停止されている状態'),
  ('inactive', '無効', 'アーティスト活動を停止している状態')
ON CONFLICT (status_code) DO NOTHING;
