# 計測基盤の調査・設計（プロフィール認知計測）

> [`profile-information-design.md`](../product/profile-information-design.md) §5-2 の**計測の意図**を起点に、「どうデータを貯め／どう計測を実装するか」を調査・提案する。**WIP**。一部は現行規範（`profile-api-design.md`（未作成） §5）と意図的に分岐する（→ §6）。

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

| カラム                         | 説明                                                             |
| ------------------------------ | ---------------------------------------------------------------- |
| `id` / `event_type`            | PK / `profile_view`・`story_expand`・`story_scroll`・`sns_click` |
| `artist_id` (fk→artists, null) | JOIN 軸                                                          |
| `anon_id` / `session_id`       | 匿名識別子（PII なし）/ 離脱・深度の連結単位                     |
| `path` / `referrer`            | どの画面 / 入口                                                  |
| `props` (jsonb)                | `story_scroll`→`{depth}`、`sns_click`→`{platform}`               |
| `occurred_at` / `created_at`   | 発生時刻 / 受信時刻                                              |

- index: `(artist_id, event_type, occurred_at)`, `(session_id)`。
- migration は [`database-migration.md`](../architecture/server/database/migration.md) の手順（`db:generate`→`db:migrate`）。

### 5-2. イベントと発火点（UI 層のみ）

| イベント       | 発火点                    | 意図   |
| -------------- | ------------------------- | ------ |
| `profile_view` | 詳細表示（セッション1回） | ①      |
| `story_expand` | 「もっと読む」展開        | ②③     |
| `story_scroll` | Story 25/50/75/100% 到達  | ③      |
| `sns_click`    | SNS リンククリック        | ③/応援 |

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

## 6. 規範との差分（要確認）

| 論点             | 現行規範                     | 本書                                              |
| ---------------- | ---------------------------- | ------------------------------------------------- |
| 計測 API         | §5「専用 API は作らない」    | 薄い取り込みルートを**エントリ層**に置く          |
| 主軸ツール       | Vercel WA + カスタムイベント | WA は補助(①)に降格、主軸を自前テーブル(orPostHog) |
| フロント側に置く | ドメイン/データ層に混ぜない  | **踏襲**（発火=UI層、取り込み=エントリ層）        |

→ 取り込みルートは原則の**精神には反しない**（検証/送信のみ）。文言改定の可否と L2 の選択（自前 / PostHog）が確認事項。CLAUDE.md に従い勝手に実装へ落とさず合意後に規範を更新する。

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

## 8. 未決事項

- 規範差分（§6）の可否、L2 を自前 / PostHog のどちらにするか。
- `props`(jsonb) と実カラム昇格の線引き。
- `anon_id`/`session_id` の生成・保持方式と同意表示の要否。
- bot/運営自身のアクセス除外。

---

## 関連

- [`profile-information-design.md`](../product/profile-information-design.md) §5-2（上流）/ `profile-api-design.md`（未作成） §5（分岐元）
- [`../architecture/frontend/bff/design.md`](../architecture/frontend/bff/design.md) / [`../architecture/server/database/migration.md`](../architecture/server/database/migration.md)
