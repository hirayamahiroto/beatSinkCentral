# データベースマイグレーション

## 概要

Drizzle Kit を使用してデータベーススキーマのバージョン管理とマイグレーションを行う。

## ファイル構成

```
packages/database/
├── src/schema/           # TSスキーマ定義（信頼できる唯一の情報源）
│   ├── users.ts
│   ├── artistProfiles.ts
│   └── ...
├── drizzle.config.ts     # Drizzle Kit設定
└── drizzle/migrations/
    ├── 0000_closed_slipstream.sql   # マイグレーションSQL
    ├── 0001_silent_lilandra.sql
    └── meta/
        ├── _journal.json            # マイグレーション一覧
        ├── 0000_snapshot.json       # 各時点のスキーマスナップショット
        └── 0001_snapshot.json
```

## 2つのコマンドの役割

### `drizzle-kit generate`（開発時）

TSスキーマとスナップショットを比較し、差分SQLを生成する。

```
TSスキーマ (src/schema/*.ts)
        ↓ 比較
最新スナップショット (meta/NNNN_snapshot.json)
        ↓ 差分検出
新しいSQLファイル + スナップショット + ジャーナル更新
```

```bash
npm run db:generate -w database
```

### `drizzle-kit migrate`（CI/本番適用時）

ジャーナルとDB内の適用済み記録を比較し、未適用のSQLを実行する。

```
_journal.json（全マイグレーション一覧）
        ↓ 比較
__drizzle_migrations テーブル（DB内、適用済み記録）
        ↓ 差分検出
未適用SQLを順番に実行
```

```bash
npm run db:migrate -w database
```

**重要**: `migrate` はスナップショットを参照しない。SQLファイルとジャーナルのみで動作する。

## 開発フロー

### 1. スキーマを変更

`src/schema/` 配下のTSファイルを編集する。

### 2. マイグレーションを生成

```bash
npm run db:generate -w database
```

新しいSQLファイル・スナップショット・ジャーナルエントリが自動生成される。

### 3. コミット＆プッシュ

生成されたファイルをすべてコミットする。

### 4. CI/CDで自動適用

GitHub Actionsのデプロイワークフローで `db-migrate` ジョブが自動実行される。

```
push → db-migrate（マイグレーション実行） → deploy（デプロイ）
```

マイグレーション失敗時はデプロイがスキップされる。

## 注意事項

- SQLファイルを手動作成・編集しない。必ず `drizzle-kit generate` で生成する
- スナップショットは `generate` の差分検出に使われるため、手動で変更しない
- `_journal.json` に登録されていないSQLファイルは `migrate` で無視される
- CI/CDでの接続にはSupabase Pooler（Session mode）のURLを使用する
