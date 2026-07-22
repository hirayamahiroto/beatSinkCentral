# データベース接続パターン（Supabase）

Supabase が提供する 3 種類の接続方式を、用途ごとに使い分けるためのガイド。

新しい環境(本番 / Preview / ローカル)を立ち上げるとき、CI/CD のマイグレーションが落ちたとき、Vercel に env を登録するときに参照する。

## 3 種類の接続

Supabase は同じ DB に対して 3 つの「入り口」を提供している。

```
                  [Application]
                       |
   ┌───────────────────┼───────────────────┐
   ↓                   ↓                   ↓
[Direct]      [Session Pooler]      [Transaction Pooler]
db.<ref>      <region>.pooler       <region>.pooler
.supabase.co  .supabase.com:5432    .supabase.com:6543
:5432
   ↓                   ↓                   ↓
              [Supavisor (PgBouncer 互換)]
                       ↓
                   [PostgreSQL]
```

### Direct connection（`db.<ref>.supabase.co:5432`）

- DB に直結。プールを介さない
- 1 接続 = 1 PostgreSQL プロセス（数 MB のメモリを消費）
- IPv6 デフォルト。IPv4 アドオンを購入していないと Vercel / GitHub Actions から繋がらないことがある
- PostgreSQL の全機能が使える

### Session pooler（`<region>.pooler.supabase.com:5432`）

- Supavisor 経由、ただし **1 接続 = 1 セッション**を握る方式
- pool 越しでも**接続スコープの機能は維持**される
  - advisory lock / prepared statement / `LISTEN/NOTIFY` / `SET` セッション変数 / 一時テーブル
- IPv4 OK
- Direct より接続コストが低く、Transaction より制約が少ない

### Transaction pooler（`<region>.pooler.supabase.com:6543`）

- Supavisor 経由、**トランザクション単位**で実 DB 接続をローテーション
- 1 個の実接続を多数のクライアントで共有 → 多重化効率が最大
- **接続スコープの機能は使えない**
  - advisory lock / prepared statement / `LISTEN/NOTIFY` / `SET` セッション変数 / `pg_temp`
- IPv4 OK

## 何が決め手になるか

### Serverless 適性

PostgreSQL は接続ごとにプロセスをフォークするため、「多くの短命プロセス」が苦手。
Supabase の同時接続上限は Free で約 60、Pro で約 200。

| 接続種別           | スパイク耐性 | 理由                                         |
| ------------------ | ------------ | -------------------------------------------- |
| Direct             | ✗            | Function 1 個 = 実接続 1 個。すぐ枯渇        |
| Session pooler     | ○            | 実接続は使い回されるが、セッション単位で確保 |
| Transaction pooler | ◎            | Function 100 個 = 実接続 10 個程度で済む     |

### 機能要件

advisory lock や prepared statement に依存するツールは Transaction pooler では動作しない。

| ツール                      | 必要な接続スコープ機能 | 使えるポート |
| --------------------------- | ---------------------- | ------------ |
| `drizzle-kit migrate`       | advisory lock          | 5432         |
| `prisma migrate`            | advisory lock          | 5432         |
| 一部 ORM のクエリキャッシュ | prepared statement     | 5432         |

## 用途別の選定表

| 用途                                | 接続種別                | ポート | 理由                             |
| ----------------------------------- | ----------------------- | ------ | -------------------------------- |
| Vercel api-server **ランタイム**    | Transaction pooler      | 6543   | serverless 多重化が最重要        |
| GitHub Actions **マイグレーション** | Session pooler          | 5432   | advisory lock 必須               |
| GitHub Actions **シード**           | Session pooler          | 5432   | マイグレと同じ DB に接続するため |
| ローカル開発                        | Session pooler / Direct | 5432   | 制約なしで使える方が楽           |

ポイント: **同じ DB に対して、用途で「入り口（ポート）」を切り替える**。

## 環境変数のマッピング

| 設定場所                                  | 変数名                 | 接続先        | ポート |
| ----------------------------------------- | ---------------------- | ------------- | ------ |
| GitHub Actions Secret（本番マイグレ）     | `DATABASE_URL`         | Production DB | 5432   |
| GitHub Actions Secret（Preview マイグレ） | `DATABASE_URL_PREVIEW` | Preview DB    | 5432   |
| Vercel api-server Production              | `DATABASE_URL`         | Production DB | 6543   |
| Vercel api-server Preview                 | `DATABASE_URL`         | Preview DB    | 6543   |
| ローカル `.env.local`                     | `DATABASE_URL`         | 開発用 DB     | 5432   |

- 変数名は全箇所で `DATABASE_URL` で揃える（Vercel は環境スコープ、GHA はシークレット名で区別）
- 同じ DB でも **GHA は 5432、Vercel は 6543** と用途で別 URL になる
- Preview と Production は**別 Supabase プロジェクト**にして混在を避ける

## ハマりやすい罠

### 1. Transaction pooler でマイグレを叩いてハング

`drizzle-kit migrate` が `applying migrations...` で延々スピンしてタイムアウト落ちする場合、ほぼ確実に `DATABASE_URL` のポートが 6543（Transaction）になっている。

advisory lock の取得待ちが解消されず、エラーすら返らずに止まる。

→ 5432（Session pooler）に変更する。

### 2. 「ローカルで通るのに CI で落ちる」

ローカルの `.env.local` は Session pooler、CI のシークレットが Transaction pooler になっているケース。
**CI 側のシークレット**を確認する（GitHub Settings → Secrets → 該当変数の Updated タイムスタンプ）。

### 3. パスワードの URL エンコード

DB パスワードに `@` `#` `?` `/` `%` `:` `+` 等が含まれる場合は URL エンコード必須。

```
pa@ss#word  →  pa%40ss%23word
```

### 4. リージョンプレフィックス

`aws-0-...` と `aws-1-...` は別物。Supabase が自動で割り当てるため推測せず、Dashboard の Connection string を**そのままコピーする**。

### 5. SSL 設定

Supabase は SSL 必須。`postgres` ドライバは通常自動で SSL を有効にするが、明示しておくと事故が減る。

```
postgresql://...:5432/postgres?sslmode=require
```

## 接続文字列のひな型

```
# Session pooler（マイグレ・ローカル開発用）
postgresql://postgres.<project-ref>:<PASSWORD>@<region>.pooler.supabase.com:5432/postgres

# Transaction pooler（ランタイム用）
postgresql://postgres.<project-ref>:<PASSWORD>@<region>.pooler.supabase.com:6543/postgres

# Direct connection（IPv6 環境のみ、デバッグ用）
postgresql://postgres:<PASSWORD>@db.<project-ref>.supabase.co:5432/postgres
```

`<project-ref>` `<region>` `<PASSWORD>` は Supabase Dashboard → Settings → Database → Connection string で確認する。

## 新しい環境を立ち上げるときのチェックリスト

- [ ] Supabase プロジェクトを作成（環境ごとに別プロジェクト）
- [ ] DB パスワードを生成し、安全な場所に保管（リポジトリには絶対に置かない）
- [ ] Vercel に `DATABASE_URL`（Transaction pooler / 6543）を該当環境スコープで登録
- [ ] GitHub Actions Secrets に該当変数（Session pooler / 5432）を登録
- [ ] ローカル `.env.local` に Session pooler の URL を設定
- [ ] `npx drizzle-kit migrate` をローカルで叩いて疎通確認
- [ ] CI で db-migrate ジョブが緑になることを確認

## 関連ドキュメント

- [データベースマイグレーション](./database-migration.md) — drizzle-kit のコマンド体系と運用
- [外部クライアントの実装パターン](./external-clients.md) — 環境変数を扱うクライアントの遅延初期化
