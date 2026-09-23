# 0002: Integration Test の DB は Postgres service container で起動する

- ステータス: 採用
- 日付: 2026-09-23
- 出所: [#319](https://github.com/hirayamahiroto/beatSinkCentral/pull/319) §5-2（Issue 4、実施は C1-0）

## 決定

CI の Integration Test 用 DB は GitHub Actions の Postgres service container で起動し、既存の `db:migrate`（drizzle）でスキーマを適用する。

## 理由

- 起動が速い。
- ローカルと同じ `db:migrate` の経路をそのまま使え、CI 専用の起動手順を持ち込まない。
- 現時点で Storage 等の Supabase 固有機能に依存する Integration Test が無い。

## 却下した案

- Supabase CLI（`supabase start`）で起動する。起動が重く、いま必要な機能は Postgres だけで足りる。Storage 等に依存するテストが必要になった時点で見直す。

## 影響する規範

- `docs/architecture/testing/strategy.md` §7-3 Integration Test
- `docs/architecture/server/database/connection.md`
