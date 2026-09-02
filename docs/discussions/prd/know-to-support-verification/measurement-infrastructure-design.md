# 計測基盤の調査・設計（プロフィール認知計測）

> [`profile-information-design.md`](../../../product/profile-information-design.md) §5-2 の**計測の意図**を起点に、「どうデータを貯め／どう計測を実装するか」を調査・提案する。**WIP**。一部は現行規範（`profile-api-design.md`（未作成） §5）と意図的に分岐する（→ §6）。

---

## 1. 結論サマリ

- 意図（§5-2）は **探索／学習**。アーティスト単位で「どこに人が来て・どこで離れ・どこまで読まれたか」を**後から自由に問い直す**のが目的。
- これが要求するデータ特性: **生イベント / セッション連結 / `artists` への JOIN / ad-hoc SQL**。
- 調査の核心: **Vercel WA カスタムイベントはこの意図に構造的に合わない**（集計ダッシュボードのみ・生イベントの SQL/エクスポート/JOIN 不可・高カーディナリティな `artistId` で破綻）。
- **提案**:
  - L1（即・ゼロ実装）: Vercel WA の pageview → ①の粗い基準線。
  - L2（主軸・推奨）: **自前イベントテーブル（Supabase/Postgres）＋ 薄い取り込みルート**。SQL で 3 意図に答え、`artists` と JOIN でき、将来の移行にも耐える。
  - 代替: ダッシュボードを自作したくないなら **PostHog**。

---

## 2. 前提

- 意図（§5-2）: ①アクセス量 / ②離脱 / ③閲覧深度 を掴み、**特集の題材選定（編集判断）**に活かす。最適化ではなく学習。
- 構成: Next.js 15 + **Hono BFF** + **Drizzle/Supabase** + Vercel + Auth0。計測ライブラリは**未導入**。
- 原則: 計測は**フロント/エントリ層**に置きドメイン/データ層に混ぜない。フレームワーク固有 API は薄いラッパに閉じる（将来 Hono standalone 化）。イベントは `artists` と FK で結ぶ（リレーション正規化）。

---

## 3. 意図 → 必要なデータ特性

| 意図 | クエリの形                                      |
| ---- | ----------------------------------------------- |
| ①    | アーティスト別の閲覧数・入口別                  |
| ②    | 詳細到達したが Story 未展開の割合・最終到達段階 |
| ③    | Story 読了深度（25/50/75/100%）の分布・人別     |

→ 共通要求: **生イベントが残り / セッションで連結でき / `artists` に JOIN でき / 後付けの問いに SQL で答えられる**こと。

---

## 4. データの貯め方 — 比較

| 観点                    | A: Vercel WA カスタム | B: PostHog | C: 自前テーブル ★ |
| ----------------------- | --------------------- | ---------- | ----------------- |
| ① 粗いアクセス量        | ◎（無料・ゼロ実装）   | ◎          | ○                 |
| ① アーティスト単位 / ②③ | ✕ / △                 | ○ / ◎      | ◎ / ◎             |
| SQL ドリルダウン・JOIN  | ✕                     | △          | ◎                 |
| データ所有・移行耐性    | △                     | △          | ◎                 |
| 立ち上げ速度            | ◎                     | ◎          | ○                 |
| 実装/運用コスト         | 最小                  | 小         | 中（薄い）        |

- **A**: pageview は無料で①の基準線に最適。だが集計ダッシュボードのみで②③・アーティスト単位①に不向き → 主軸不可。
- **B**: funnels/scroll/breakdown 標準装備・無料 100 万 events/月。最速だが外部ベンダ依存・同意/PII 配慮。
- **C**: 生データの問い直し自由度が最高。`artists` と JOIN・所有・移行耐性。ダッシュボードは無いが学習段階は ad-hoc SQL で足りる。

**推奨 = C（+ L1 として A の pageview 併用）**。理由: 意図が探索ゆえ生データ自由度が最優先・トラフィック小で自前の弱点が出ない・既存資産（Supabase/Drizzle/Hono）と一直線・横断制約に整合。

---

## 5. 設計（案C）

### 5-1. テーブル `analytics_events`

常に絞る軸は実カラム、イベント種別で変わる部分のみ `props`(jsonb)。

| カラム                         | 説明                                                                                                                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id` / `event_type`            | PK / §5-2 の 9 種（`profile_view`・`story_expand`・`story_scroll`・`offer_click`・`support_click`・`listening_point_play`・`notify_subscribe`・`survey_answer`・`invite_open`/`invite_signup`） |
| `artist_id` (fk→artists, null) | JOIN 軸                                                                                                                                                                                         |
| `anon_id` / `session_id`       | 匿名識別子（PII なし）/ 離脱・深度の連結単位                                                                                                                                                    |
| `path` / `referrer`            | どの画面 / 入口                                                                                                                                                                                 |
| `props` (jsonb)                | イベントごとの付帯情報。§5-2 の props 列を参照                                                                                                                                                  |
| `occurred_at` / `created_at`   | 発生時刻 / 受信時刻                                                                                                                                                                             |

- index: `(artist_id, event_type, occurred_at)`, `(session_id)`。
- migration は [`database-migration.md`](../../../architecture/server/database/migration.md) の手順（`db:generate`→`db:migrate`）。

**props / 実カラム昇格の線引き（T00 確定）**: 「イベント種別を問わず全クエリで絞り込み・JOIN・集計に使う軸」だけを実カラムにする（`artist_id`・`anon_id`・`session_id`・`event_type`・`occurred_at`・`path`・`referrer`）。特定イベント種別だけが持つ付帯情報は `props` に置く。ある `props` のキーが複数イベント種別で共通に必要になり、かつそれで頻繁に絞り込む/集計する運用が実際に出てきた時点で、その時点のキーだけを実カラムへ昇格する（先回りして昇格しない）。

### 5-2. イベントと発火点（UI 層のみ）

検証ベータ PRD §6-1 の追記込みで確定（T00, 2026-09-02）。`sns_click` は `support_click`（SNS・フォロー等を包括）に統合。

| イベント                        | 発火点                    | props                                                                   | 意図     |
| ------------------------------- | ------------------------- | ----------------------------------------------------------------------- | -------- |
| `profile_view`                  | 詳細表示（セッション1回） | `from`（`announce` / `share` / `search` / `invite` / `none`）           | ①/H2     |
| `story_expand`                  | 「続きを読む」展開        | —                                                                       | ②③/H3    |
| `story_scroll`                  | Story 25/50/75/100% 到達  | `{depth}`                                                               | ③/H3     |
| `offer_click`                   | オファーのボタン          | `position`（`hero` / `after-story`）                                    | H3       |
| `support_click`                 | SNS・フォロー等           | `platform`, `position`                                                  | 先行指標 |
| `listening_point_play`          | 聴きどころの再生          | `position`                                                              | H3       |
| `notify_subscribe`              | 告知受信の登録            | —                                                                       | H5       |
| `survey_answer`                 | 一問アンケート            | `is_beatboxer: boolean`（詳細ページ）/ `questionCode, answer`（その他） | H2       |
| `invite_open` / `invite_signup` | 招待リンク                | `inviter_artist_id`                                                     | H6       |

- `story_scroll` は **IntersectionObserver**、送信は **`sendBeacon`**（離脱取りこぼし防止）。

### 5-3. 呼び出し口は自前ラッパ 1 枚（移行耐性）

ベンダ SDK/fetch を直接撒かず `track()` 経由に集約。差し替え（自前⇄PostHog⇄WA）が 1 ファイルで効く。

```ts
type AnalyticsEvent =
  | { type: "profile_view"; artistId: string }
  | { type: "story_scroll"; artistId: string; depth: 25 | 50 | 75 | 100 }
  | { type: "sns_click"; artistId: string; platform: string };
// 実装は sendBeacon("/api/events") に送るだけ（送信先はラッパ内の関心事）
```

### 5-4. 取り込みルート `POST /api/events`（薄いパススルー）

zod 検証 → `analytics_events` へ insert するだけ。集計/整形は持たない。`session_id`/`anon_id` はサーバ側で補完、bot は捨て、fire-and-forget（204）。

---

## 6. 規範との差分（T00 で確定）

| 論点             | 現行規範                     | 本書                                                                     |
| ---------------- | ---------------------------- | ------------------------------------------------------------------------ |
| 計測 API         | §5「専用 API は作らない」    | 薄い取り込みルートを**エントリ層**に置く（**確定**）                     |
| 主軸ツール       | Vercel WA + カスタムイベント | WA は補助(①)に降格、主軸を**自前テーブル**（**確定**。PostHog は不採用） |
| フロント側に置く | ドメイン/データ層に混ぜない  | **踏襲**（発火=UI層、取り込み=エントリ層）                               |

→ 取り込みルートは原則の**精神には反しない**（検証/送信のみ）。L2 は**自前 `analytics_events`** に確定（T00, 2026-09-02）。理由: 意図が探索ゆえ生データ自由度が最優先・トラフィック小で自前の弱点が出ない・既存資産（Supabase/Drizzle/Hono）と一直線。

---

## 7. 段階導入

| Step | 内容                                                   |
| ---- | ------------------------------------------------------ |
| 0    | Vercel WA 有効化（①の無料基準線）                      |
| 1    | `analytics_events` スキーマ + migration                |
| 2    | 取り込みルート + `track()` ラッパ                      |
| 3    | 詳細ページに計測フック（view/expand/scroll/sns_click） |
| 4    | ad-hoc SQL で編集レビュー → 必要なら軽い可視化         |

---

## 8. 決定事項（T00, 2026-09-02）

- 規範差分（§6）は確定。L2 は**自前 `analytics_events`**（PostHog は不採用）。
- `props`(jsonb) と実カラム昇格の線引き: §5-1 に記載の基準で確定。
- `anon_id`/`session_id` の生成・保持方式: どちらもランダム UUID をクライアント Cookie に保持。`anon_id` は長期（1年、初回アクセス時に発行）、`session_id` は短期（30分の非アクティブでローテーション）。PII を含まない機能 Cookie（大衆向け・未ログイン閲覧の計測に必須）であり、広告・第三者トラッキングではないため同意バナーは不要。プライバシーポリシーに計測目的を明記する（運用タスク、コード変更ではない）。
- bot/運営自身のアクセス除外: 取り込みルート（`POST /events`）で User-Agent が既知の bot/crawler パターンに一致するリクエストを破棄する（DB へ insert しない）。運営自身のアクセスは、内部確認用 URL（`?internal=1` 等）でセットする長期 Cookie を取り込みルートが検知して除外する。IP allowlist は運用コストに見合わないため採用しない。

---

## 関連

- [`profile-information-design.md`](../../../product/profile-information-design.md) §5-2（上流）/ `profile-api-design.md`（未作成） §5（分岐元）
- [`../../../architecture/frontend/bff/design.md`](../../../architecture/frontend/bff/design.md) / [`../../../architecture/server/database/migration.md`](../../../architecture/server/database/migration.md)
