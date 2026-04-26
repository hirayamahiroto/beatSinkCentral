# Phase 1 UI 実装方針

## このドキュメントの位置づけ

Phase 1（プレイヤー紹介）の **UI 実装** に焦点を絞った方針書。
バックエンド／DB レイヤーの段取りは [`roadmap.md`](./roadmap.md) と [`step1-implementation-plan.md`](./step1-implementation-plan.md) を一次情報とし、本書は重複を避けて UI 観点のみを整理する。

設計規約は [`docs/frontend-architecture/`](../frontend-architecture/) を一次情報とする。本書はそれを Phase 1 にどう適用するかの計画。

---

## ゴール

「未ログインユーザーがトップページからプレイヤーを閲覧でき、登録ユーザーは自身のプロフィールを公開できる」状態を、UI として完成させる。

具体的には:

- 未ログインでも Top / Player 一覧 / Player 詳細を閲覧できる
- ログインから Dashboard までの導線が UI として完結している
- Onboarding がバックエンドの契約と一致した形で動く
- Player 一覧／詳細がモックデータではなく API 経由の実データで描画される

---

## 現状棚卸し

### `apps/beatfolio/src/app`

| ルート                   | 状態                                 | 備考                                                                   |
| ------------------------ | ------------------------------------ | ---------------------------------------------------------------------- |
| `/` (page.tsx)           | 認証必須＋ログイン未済はリダイレクト | Top 公開化が必要                                                       |
| `/onboarding`            | 画面あり、API 接続済                 | フォーム項目と API 契約に乖離あり（step1-implementation-plan.md 参照） |
| `/players`               | モックデータ                         | API 連携が必要                                                         |
| `/event`, `/eventDetail` | モックデータ                         | Phase 1 スコープ外（後述）                                             |
| `/admin/*`               | モックデータ                         | Phase 1 スコープ外（後述）                                             |
| `/about`                 | 静的                                 | 触らない                                                               |
| `/dashboard`             | 未作成                               | 新規作成                                                               |

### `packages/ui/src/design-system`

- `primitives/`: button, card, input, select（shadcn/ui 由来）
- `components/atoms/`: Button, Card, Icon, Image, Input, Link, Select
- `components/templates/`: Layout
- `components/pages/`: 各画面の Page コンポーネントが実体としてここに置かれている（Top/Players/Player/Event/Admin\*/About）
- `components/molecules/`, `components/organisms/`: **未整備**

### 既存規約とのギャップ

- `component-design.md` の階層想定では Pages は **アプリ側** に Template と Organism を組み合わせて作る完成品。現状 `packages/ui` 内に Page 実体がある構造になっており、責務境界がぶれている。
- Molecules / Organisms 層が空のまま、Pages が atoms を直接組み立てている。
- 本フェーズではこの構造の是非には踏み込まず、**「現状の置き場所のまま動かす」** を前提とする。再編は Phase 1 完了後に別タスクで扱う（後述の Out of Scope）。

---

## 実装方針

### 1. ページ単位でスライスする

機能横断でまとめて作らず、**ユーザー導線の単位** で 1 スライスずつ完成させる。1 スライスは「UI が動き、API と繋がり、手動確認できる」までを 1 単位とする。

### 2. モック → 実データの切替は1ページずつ

Player 一覧と詳細は別スライスに分ける。並行で進めると API 仕様の固まり方とずれて手戻りになる。

### 3. データ取得は Server Component に寄せる

- ページの初期データ取得は Server Component（`app/**/page.tsx`）で行う
- インタラクティブな状態が必要な箇所のみ `"use client"` の Adapter を切り出す
- UI コンポーネント本体（atoms 以上）は props を受け取って描画するだけ
- 規約は [`component-design.md` の責務分離パターン](../frontend-architecture/component-design.md) に従う

### 4. UI 部品の追加は最小限

- Phase 1 で必要な部品が atoms にあるなら atoms を直接組み合わせる（[`component-design.md` 「複雑なフィールドへの対応方針」](../frontend-architecture/component-design.md)）
- 同パターンが 2 ページ以上で繰り返されたら初めて Molecule 化を検討する
- Molecules / Organisms を「整備するため」だけに作らない

### 5. Storybook 整備は本フェーズで追わない

Phase 1 の検証は手動確認 + ユニット/結合テストで行う。Storybook の網羅は別タスク。

---

## 着手順序

### Slice A: 認証導線の完成

step1-implementation-plan.md の Phase 1 / Phase 5 と一致する範囲。UI として変更するのは以下。

| ページ                        | 作業                                                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `/` (page.tsx)                | `redirect("/auth/login")` を削除。セッション有無でヘッダー右の CTA を「ログイン」/「ダッシュボード」に切替             |
| `/onboarding/ProfileForm.tsx` | `username` フィールド削除。`email` を props で受け取り、`{ email, accountId }` を `/api/users/create` に送信           |
| `/onboarding/page.tsx`        | セッションから email を取得して ProfileForm に渡す。登録済みユーザーは `/dashboard` へ                                 |
| `/dashboard/page.tsx`         | 新規。`/api/users/me` の結果で 3 分岐（未登録 → onboarding、プロフィール未作成 → 促進メッセージ、作成済み → 基本情報） |
| `middleware.ts`               | 認証必須を反転（`/onboarding/*`, `/dashboard/*`, 認証必要な `/api/*` のみ保護）                                        |

完了条件: 未ログインで `/` が見られ、ログイン後の登録〜ダッシュボード表示までが手で通る。

### Slice B: プレイヤー紹介の実データ化

前提: バックエンドが `GET /api/players` と `GET /api/players/:id` を提供していること（`roadmap.md` Step 2/3）。前提が揃わない時点で UI の実データ切替は始めない。

| ページ                     | 作業                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `/players`                 | モックデータ取得部を `GET /api/players` 呼び出しに置換。一覧表示に必要なミニマム項目は「名前」「アーティスト写真」 |
| `/players/[id]`            | 新規 or 既存詳細ページの API 連携。公開プロフィールの全項目を表示                                                  |
| プロフィール作成・編集画面 | `roadmap.md` Step 2 に対応する UI。配置は `apps/beatfolio/src/app/dashboard/profile/` を想定（要確定）             |

完了条件: プロフィール登録済みのユーザーのみ一覧に出て、詳細が見られる。未登録ユーザーは出ない。

### Slice C: 公開ページ整備と SEO

| 対象                        | 作業                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| ヘッダー                    | 未ログイン時の「ログイン」「サインアップ」CTA を確定形に                        |
| `/players`, `/players/[id]` | 認証不要で閲覧可能になっていることを確認（middleware と Server Component 双方） |
| メタデータ                  | `generateMetadata` で OGP / 動的タイトルを設定                                  |

完了条件: 未ログインで Top → Player 一覧 → Player 詳細が遷移でき、SNS シェアで OGP が出る。

---

## 着手前に確定が必要な事項

Slice をブロックする可能性のある未決事項。**Phase 0（要件定義）の進捗に依存する** ものを含む。

- プロフィール項目の確定（Player Profile Entity のフィールド）— Slice B のフォーム設計に直結
- アーティスト写真のアップロード方式（S3 等）— Slice B の作成・編集画面に直結
- プレイヤー一覧の検索／フィルタ／ソート仕様 — Slice B の一覧 UI に直結
- 一覧表示のページネーション方式（offset / cursor）— 同上
- 公開する API エンドポイントと公開項目の境界（公開プロフィールに含めない項目があるか）— Slice C

これらは Phase 0 の出力を待つ。確定前に Slice B を着手すると手戻りが大きい。

---

## Out of Scope（Phase 1 では触らない）

- イベント関連 UI（`/event`, `/eventDetail`）
- 管理画面（`/admin/*`）
- Storybook の網羅整備
- Molecules / Organisms の事前整備（必要になった時点で追加）
- `packages/ui/src/design-system/components/pages/` を `apps/beatfolio` 側へ移すリファクタ（Phase 1 完了後の課題として記録）
- デザイントークンの整備（カラー / タイポグラフィ）

---

## 検証方法

各スライス完了時に以下を満たすこと。

1. `npm run build` が通る
2. `npm test -- --filter beatfolio` が通る（テストがあるもののみ）
3. ブラウザ手動確認:
   - Slice A: 未ログインで `/` 表示、ログイン → onboarding → dashboard の流れ、再アクセス時に onboarding がスキップされる
   - Slice B: プロフィール登録済みのみ一覧表示、詳細遷移、未登録ユーザーは一覧に出ない
   - Slice C: 未ログインで Top → 一覧 → 詳細が遷移可能、メタデータが反映

UI の golden path とエッジ（未ログイン／未登録／登録済みプロフィール未作成／登録済み完了）を毎スライスで確認する。

---

## 関連ドキュメント

- [`roadmap.md`](./roadmap.md) — Phase 1 全体ロードマップ
- [`step1-implementation-plan.md`](./step1-implementation-plan.md) — Step 1 の詳細実装計画
- [`docs/frontend-architecture/component-design.md`](../frontend-architecture/component-design.md) — Atomic Design 規約
- [`docs/frontend-architecture/application-policy.md`](../frontend-architecture/application-policy.md) — SSR/CSR 選択基準
- [`docs/frontend-architecture/state-management.md`](../frontend-architecture/state-management.md) — 状態管理方針
- [`docs/frontend-architecture/form-design.md`](../frontend-architecture/form-design.md) — フォーム実装規約
