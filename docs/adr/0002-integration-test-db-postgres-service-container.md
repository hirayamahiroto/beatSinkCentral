# 0002: Integration Test の DB は Postgres service container で起動する

- ステータス: 採用
- 日付: 2026-09-23
- 出所: [#319](https://github.com/hirayamahiroto/beatSinkCentral/pull/319) §5-2（Issue 4、実施は C1-0）

## 背景

Repository の検証が現状はビルダ spy のモックテストしか無く、`strategy.md` §7-3 が Phase 2 で予定していた実 DB の Integration Test を整備する（Issue 4）。CI で DB をどう起動するかを、vitest の `unit` / `integration` 分割（C1-0）の前に決める必要があった。ローカルは Supabase CLI で起動している。

## 決定

CI の Integration Test 用 DB は GitHub Actions の Postgres service container で起動し、既存の `db:migrate`（drizzle）でスキーマを適用する。

## 理由

- 起動が速い。
- ローカルと同じ `db:migrate` の経路をそのまま使え、CI 専用の起動手順を持ち込まない。
- 現時点で Storage 等の Supabase 固有機能に依存する Integration Test が無い。

## 却下した案

- Supabase CLI（`supabase start`）で起動する。起動が重く、いま必要な機能は Postgres だけで足りる。

## 結果

- Integration Test は Postgres の機能だけを前提に書く。Storage・Auth 等の Supabase 固有機能はこの経路では検証しない。
- ローカル（Supabase）と CI（素の Postgres）で起動手段が分かれる。スキーマは同じ migration から作るため、差が出るのは拡張機能や権限まわりに限られる。
- 再検討条件: Storage 等 Supabase 固有機能に依存する Integration Test が必要になった時点。

## 影響する規範

- `docs/architecture/testing/strategy.md` §7-3 Integration Test
- `docs/architecture/server/database/connection.md`
