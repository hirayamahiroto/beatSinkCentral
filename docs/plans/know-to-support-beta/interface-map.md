# インターフェース対応表 — 「知る → 応援する」検証ベータ

> [`plan.md`](./plan.md) の実装が従う「画面 → BFF → api-server」の対応表（task-breakdown skill Step 3 の成果物）。
> **凍結済み**（T00, 2026-09-02。§5 の協議点はユーザーが判断済み）。以後の実装はこの表を契約とする。編集画面 UI 契約のみ、§1 の通り T04①・T05① で型を定義した時点で確定する。
> 規範: `api-design-guidelines.md`（GET/POST・リソースアドレッシング・1 ユニット 1 エンドポイント）／ `bff/design.md`（read は画面単位で厚く・write は薄く・語彙解決は BFF）。

---

## 1. 画面の一覧と契約の状態

| 画面                                       | UI 契約                                             | 状態                                                                                     |
| ------------------------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 公開詳細ページ（大衆向け・7 区画）         | `AudienceArtistProfile` の props                    | **凍結済み**（表現非依存を 4 パターンで確認）                                            |
| 編集画面（Story 章・オファー・聴きどころ） | 既存 `ArtistProfileWizard` / dashboard 編集の型拡張 | **未凍結** — T04①・T05① の契約確認ステップで型を定義して凍結する（フルモックは作らない） |
| 登録フロー（招待文脈付き）                 | 既存 onboarding ＋ `?invite=`                       | 既存踏襲。招待消費のみ追加                                                               |

## 2. read（取得系 — BFF は画面単位で厚く）

| 画面・区画                 | BFF ルート                                                    | api-server エンドポイント                                                      | 備考                                                                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 公開詳細ページ 7 区画一式  | `players/getPlayerDetail` を §5-2 契約へ**拡張**（集約 1 本） | `GET /artists/:handle`（`artists/public/getArtist` を拡張）                    | **区画ごとに叩かず集約 1 本**。章・翻訳・聴きどころ・有効オファー（共演者の登録済み判定込み）・購読可否を JOIN で返す（N+1 禁止、checklist §1）。BFF が日付→表示形・問い code→文言・オファー有効判定→`null` を解決 |
| 編集画面（現況の読み込み） | `dashboard/getProfileEditScreen` を**拡張**                   | `GET /artists/:artistId/profile`（集約一本）＋ `GET /artists/:artistId/offers` | 本人・認証必須。下書き含む。応答は集約の構造（`attributes` / `story` / `links` / `published` ＋ `publishability`）                                                                                                 |
| 問いマスタ（章の設問文）   | `getProfileEditScreen` 内で解決（独立 BFF ルート不要）        | `GET /story-questions`（汎用マスタ API、`link-types` と同型。**実装済み**）    | 語彙は DB 由来・BFF で解決（checklist §14）。取得 API に文言を混ぜない（`api-read-write-definition.md` §4）                                                                                                        |

## 3. write（本人・認証必須 — BFF は `me` 名前空間の薄いパススルー）

| 操作                                               | BFF ルート                                                       | api-server エンドポイント                                         | 担当 |
| -------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------- | ---- |
| Story 章の保存（3 つの問い）                       | `artists/me/saveMyProfile`（画面都合の合成。内部で章ごとに呼ぶ） | `POST /artists/:artistId/story/chapters/:chapterKey`（章ごと）    | T04  |
| 属性の保存（名前・タグライン・ジャンル・活動情報） | 同上                                                             | `POST /artists/:artistId/attributes`                              | 済   |
| SNS リンクの保存                                   | 同上                                                             | `POST /artists/:artistId/links`（集合を差し替え）                 | 済   |
| 公開/非公開（章構造での publishability）           | 既存 `artists/me/publishMyProfile`（変更は判定のみ）             | 既存 `POST /artists/:artistId/profile/publish`                    | T04  |
| オファーの保存（日付・場所・URL・一言・共演者）    | `artists/me/saveMyOffer`（**新規**）                             | `POST /artists/:artistId/offers`（同時有効 1 件・作成/差し替え）  | T05  |
| 聴きどころの保存（動画 URL＋一言）                 | `saveMyProfile` の契約拡張（内部で聴きどころ API を呼ぶ）        | `POST /artists/:artistId/listening-point`（新規・構造ごとの更新） | T07  |
| 招待リンク発行（未登録共演者へ）                   | `artists/me/createInvite`（**新規**）                            | `POST /invites`                                                   | T11  |
| 招待の消費（登録完了時）                           | onboarding の write に `inviteCode` を追加                       | `POST /invites/:code/accept`（認証後）                            | T11  |
| 翻訳段落                                           | **API を作らない**（運営が SQL で書く。PRD F3）                  | —                                                                 | T06  |

## 4. 認証不要（大衆ブラウザ発 — 取り込み系）

| 操作                                          | BFF ルート                                            | api-server エンドポイント                                  | 担当 |
| --------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- | ---- |
| 計測イベント（§6-1 の 8 種＋`survey_answer`） | `events/trackEvent`（zod 検証＋パススルー・認証不要） | `POST /events`（bot 除去・anon/session 補完・insert・204） | T02  |
| 「次の告知を受け取る」登録                    | `players/subscribeToPlayer`                           | `POST /artists/:artistId/subscriptions`                    | T10  |
| 受信解除（メール記載 URL）                    | `players/unsubscribe`                                 | `POST /subscriptions/:token/delete`（推測不能トークン）    | T10  |

- 認証境界の整理: **公開 read ＝ handle**／**本人 write ＝ artistId＋セッション照合**／**取り込み ＝ 認証不要だが作成専用（読み出し無し）**。
- 公開 read（`GET /artists/:handle` → `players/getPlayerDetail`）の応答には `artistId` を含める。計測イベント（§6-1 の artist-scoped イベント）と取り込み系 write の識別子として大衆ブラウザが必要とする値であり、`artistId` だけで読み出せる経路は無い（T03②）。

## 5. 協議点（T00, 2026-09-02 決定）

1. **翻訳に API を作らない**（運営 SQL 運用）— **確定**。PRD F3 の明記どおり。書き込み手順の属人化は §9-2 のリスクとして許容（ベータは 3〜4 人分のみ）
2. **認証不要 write の防御水準** — **最小水準に確定**: bot UA 除去＋リクエストサイズ制限。rate limit はベータ規模では見送り
3. **subscriptions のパスキー** — **許容に確定**。認証不要 write が `artistId` を受ける形は、**作成専用で読み出しが無い**ため「ID だけで叩ける非認証エンドポイントを作らない」ガイドラインの対象外とする。`api-design-guidelines.md` に一文追記する（別 PR、T10 着手前に反映）
4. **`GET /story-questions` マスタ API の要否** — ~~ベータでは作らないに確定~~ → **2026-09-05 に方針転換し作成**。取得 API に文言を混ぜない規範（`api-read-write-definition.md` §4）を優先し、`link-types` と同型の汎用マスタ API として実装した。BFF が read 内で解決する

## 6. 計測イベント表への追記（PRD §6-1 との差分）

| イベント               | 発火点           | props      | 対応                                             |
| ---------------------- | ---------------- | ---------- | ------------------------------------------------ |
| `listening_point_play` | 聴きどころの再生 | `position` | H3（転換チャネルの分解。concept-and-loops §6-3） |
