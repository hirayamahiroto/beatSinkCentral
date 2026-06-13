---
name: frontend-feature
description: beatfolio / packages/ui のフロントエンド UI（Atomic Design + shadcn + デザインシステム）に画面・フォーム・コンポーネントを実装するときの手順とレビュー観点のハーネス。新しい画面/フォーム/コンポーネントに着手する前に読む。
---

# フロントエンド UI 実装ハーネス

`apps/beatfolio` / `packages/ui` に UI を足すときの「順序」と「毎回ハマる/見落とす観点」をまとめた手順書。
規範ドキュメントの置き換えではなく、**着手前のチェックリスト**として使う。

## 0. 着手前（必須）

- 規範ドキュメントを**先に読む**：
  - `docs/frontend-architecture/{README,component-design,form-design,application-policy,state-management,ui-library,tailwind,responsive}.md`
  - 対象機能の情報設計ドキュメント（`docs/.../*.md`）
- 横断観点は `docs/code-review-checklist.md`（特に §6 データ取得タイミング / §10 レイヤー責務 / §13 インターフェース自己説明性 / §14 コメントを残さない / §15 型安全を壊す Optional フォールバックを使わない）。
- **設計ドキュメントが規範、既存コードは実装結果**。食い違ったら勝手に既存へ合わせず **ユーザーに共有して方針確認**（CLAUDE.md）。
- **まず情報設計／動線を固める**（何を・どの順で・どこまで開示するか）。必要なら素の HTML モックで動線を確認してから React 化する。Layer 0（業務/情報設計）が無いまま部品を作り始めない（[[feedback_business_design_before_ai]]）。
- 作業は `git worktree` で別ブランチ。monorepo は worktree に hoist されないので **`npm install` をその場で実行**。
- **コミットはユーザーに明示的に言われるまでしない。**

## 1. 実装順序（Atomic Design＝部品から外側へ）

```
情報設計/動線確定（必要ならHTMLモックで先に検証）
  → 不足 primitive を shadcn add（packages/ui で実行・改変しない）
  → atoms（primitive を薄くラップ・色味のみ）
  → molecules（atoms 組み合わせ・RHF 非依存の Controlled API）
  → organism（プロダクト固有・RHF + zod）
  → app（page.tsx=server + ClientAdapter + hook）
  → Storybook（各コンポーネントに index.stories.tsx）
```

## 2. レイヤー別の勘所

### カラー / デザイントークン
- **neutral dark テーマ**。`bg-background` / `text-foreground` / `bg-primary` / `bg-card` / `text-muted-foreground` / `border-border` / `bg-secondary` / `destructive` を使う。
- 出所は `packages/ui/global.css` の CSS 変数（oklch・dark-first）。**アドホックな色（`bg-lime-400` 等）を直書きしない**。モックで使った差し色は実装に持ち込まない。

### primitives（shadcn）
- 不足コンポーネントは `cd packages/ui && npx shadcn@latest add <name> --yes`（`components.json` は `packages/ui`・**network 必要**）。生成物は**改変しない**。`primitives/index.ts` に export を追加。
- radix 依存は primitives の例外。atoms 以上に持ち込まない。

### atoms
- primitive を薄くラップ。**色味（`bg-white/5 border-white/10` 等）のみ上書きし、padding / flex / gap / rounded などの構造スタイルは持たない**（[[feedback_atom_thin_wrapper_brand_only]]）。
- 表現を増やすときは `className` 直書きでなく **`variant` / `tone` の軸を追加**（例: Typography に `tone="muted"`）。
- ref が要る（フォーカス制御・フォーム接続）→ `forwardRef`、表示専用 → 単純関数。
- `Stack` は generic atom を組み合わせて文脈を作る organism / page で使う。文脈を持つ atom（Card 等）は自分の構造を所有する（[[feedback_stack_layer_responsibility]]）。

### molecules
- atoms の組み合わせ + レイアウト `className` のみ。**RHF 非依存**＝`value` / `onChange` / `ref` の Controlled API（`register` でも `Controller` でも繋がる形に保つ）。
- `FormField` が label / htmlFor / hint / error の a11y 連携を内部完結している。新フィールドはこれに乗せる。

### organisms
- プロダクト固有。`className` 直書き可。**RHF + zod**（schema は画面と 1:1＝UI 入力ルール。サーバーのドメイン検証とは責務が別で、重複は許容）。
- `register` を第一選択。`Controller` は非ネイティブ / 複合入力のみ（TagInput・Switch・Select 等）。配列は `useFieldArray`。
- 状態管理ライブラリ（Jotai 等）は現時点で入れない（[[feedback_state_management]]）。

### app（`apps/beatfolio`）
- `page.tsx` = server（データ取得・`redirect`・session 判定）。`"use client"` は **ClientAdapter のみ**に集約。hook は純粋（`next/*` 利用可だがディレクティブは付けない）。
- `next/link` / `next/image` / `next/navigation` は **app 層だけ**。`packages/ui` は Next 非依存に保つ（[[feedback_keep_foundation_react_ts]]）。ClientAdapter が hook の戻り値を関数 / 値として organism に渡す。

### Storybook
- 各コンポーネントに `index.stories.tsx`。description は**責務と使い時**に絞る。Tailwind クラス列挙などの実装詳細は書かない（[[feedback_storybook_descriptions]]）。
- 必須 props を持つ Controlled コンポーネントの story は、args を満たしつつ `render` で state を持たせて挙動を見せる。

## 3. 検証（完了の定義）

```bash
cd packages/ui && npx tsc --noEmit        # 型。新規ファイルのエラーを git diff で切り分け
cd packages/ui && npm run storybook        # 目視（:6006）
# 実アプリ動線: apps/beatfolio で npm run dev（:3000・要 .env.local）
```

- 既存の無関係エラー（`.jpeg` の型宣言不足など）と、自分の変更起因のエラーを切り分ける（`git status` で diff 範囲を確認）。
- lint は worktree に `eslint-plugin-storybook` が無いと動かないことがある（環境要因。コード起因ではない）。

## 4. やりがちな失敗

- モックのアドホックカラー（lime 等）をそのまま実装に持ち込む → デザイントークンへ。
- atom に padding / flex などの構造スタイルを足す（色味のみが原則）。
- RHF を organism でなく molecule / atom に持ち込む。
- `"use client"` を organism や hook に書く（ClientAdapter に集約する）。
- `packages/ui` に `next/*` を import する。
- Storybook の description に実装詳細を書く。
- worktree で `npm install` を忘れる / 言われていないのにコミットする。
- 情報設計が決まる前に部品を作り始める（動線→項目→部品の順）。
- 必須値を `session.user?.email ?? ""` のように `?? 既定値` で埋めて型安全を壊す（欠落は `redirect`/`throw` で明示的に落とすか、正しく型付けされた契約から取得する。§15）。
- コードの言い換えコメントを書く（役割は命名・構造で表し、理由は `docs/` へ。§14）。
