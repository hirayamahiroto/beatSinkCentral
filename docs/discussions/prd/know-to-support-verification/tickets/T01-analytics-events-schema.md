# T01: `analytics_events` テーブルと migration

| 項目 | 内容                             |
| ---- | -------------------------------- |
| 対応 | F5, PRD §6-1 / 計測基盤設計 §5-1 |
| 種別 | 作る                             |
| 依存 | T00（L2 = 自前の確定）           |
| 規模 | S                                |

## 背景

計測はすべての仮説（H1〜H6）の前提。[`measurement-infrastructure-design.md`](../measurement-infrastructure-design.md) §5-1 のテーブル設計に、PRD §6-1 の `from` / `position` を反映して実装する。

## スコープ

### やること

- `packages/database/src/schema/analyticsEvents.ts` を追加
  - 実カラム: `id` / `event_type` / `artist_id`（fk→artists, nullable）/ `anon_id` / `session_id` / `path` / `referrer` / `from`（流入元: `announce` / `share` / `search` / `invite` / `none`）/ `props`(jsonb) / `occurred_at` / `created_at`
  - `from` は全イベントで絞る軸になるため実カラム。`position` / `depth` / `platform` / `is_beatboxer` / `inviter_artist_id` はイベント種別ごとに変わるため `props`
  - `event_type` は PRD §6-1 の 8 種（`profile_view` / `story_expand` / `story_scroll` / `offer_click` / `support_click` / `notify_subscribe` / `survey_answer` / `invite_open` / `invite_signup`）
- index: `(artist_id, event_type, occurred_at)`, `(session_id)`
- migration（`db:generate` → `db:migrate`。手順は `docs/architecture/server/database/migration.md`）

### やらないこと

- 取り込みルート・`track()`（T02）
- 集計ビュー・ダッシュボード（§5-3 非対象。週次は ad-hoc SQL＝T14）

## 受け入れ条件

- [ ] migration が全環境手順（Pooler / Direct の使い分け含む）で適用できる
- [ ] `from` の値がスキーマ上の制約（enum または check）で §6-1 の 5 値に限定されている
- [ ] PII を持つカラムが無い（メールアドレス等は入れない。受信登録は T10 の別テーブル）

## 参照

- `docs/architecture/server/database/design.md` / `migration.md` / `connection.md`
