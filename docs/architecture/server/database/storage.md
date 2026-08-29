# Supabase Storage（バケット管理）

## 概要

ファイルアップロード（現状はアーティストのプロフィール画像のみ）には Supabase Storage を使用する。
バケットの定義・変更は **drizzle マイグレーションを SoT** として管理する。

## バケット定義の管理方式

Supabase Storage のバケットは同一 Postgres 内の `storage.buckets` テーブルの行として管理される。
このため、バケットの作成・設定変更は `packages/database/drizzle/migrations/` のカスタムマイグレーション
（`drizzle-kit generate --custom`）で行う。

- 既存のマイグレーション実行経路（GHA の `db:migrate`・ローカルの `npm run db:migrate -w database`）に
  そのまま乗るため、環境ごとの手動作業や drift が発生しない
- `packages/database/supabase/config.toml` の `[storage.buckets.*]` 宣言は**使わない**
  （マイグレーションとの二重管理になるため。SoT はマイグレーション1つに保つ）
- Supabase Dashboard での手動作成・変更も行わない
- 冪等性のため `ON CONFLICT (id) DO UPDATE` で宣言する（設定変更も同じ形で上書きできる）

## バケット一覧

| バケット         | public | file_size_limit | allowed_mime_types                | 用途                           |
| ---------------- | ------ | --------------- | --------------------------------- | ------------------------------ |
| `profile-images` | true   | 5242880 (5MiB)  | image/jpeg, image/png, image/webp | アーティストのプロフィール画像 |

## アクセスモデル

- **書き込み**: api-server が `SUPABASE_SERVICE_ROLE_KEY` で実行する（service role は RLS をバイパス）。
  anon key はどのアプリにも配布せず、`storage.objects` に anon 向けポリシーも作成しない
  （= RLS デフォルト拒否により、api-server 以外からの書き込みは不可）
- **読み取り**: public バケットの公開 URL（`/storage/v1/object/public/...`）で行う。
  署名付き URL は使用しない
- 環境変数（`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`）は api-server のみに置く。
  beatfolio は BFF 経由で api-server にファイルを中継し、Storage へ直接アクセスしない

## オブジェクトキー設計（profile-images）

```text
{artistId}/{randomUUID()}.{ext}
```

- `upsert: false` で常に新規キーに書き込む。URL が毎回変わるため CDN キャッシュバスティングが完結する
- 旧画像のクリーンアップ（孤児オブジェクトの削除）は未実装。後続課題

## 後続課題

- 差し替え時に不要になった旧オブジェクトの削除（バッチ or 差し替え時削除）
- `image_url` のドメイン許可リスト化（自前 Storage の URL のみ受け付ける）
