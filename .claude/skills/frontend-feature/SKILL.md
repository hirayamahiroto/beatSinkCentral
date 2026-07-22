---
name: frontend-feature
description: beatfolio / packages/ui のフロントエンド UI（Atomic Design + shadcn + デザインシステム）に画面・フォーム・コンポーネントを実装するときの手順とレビュー観点のハーネス。新しい画面/フォーム/コンポーネントに着手する前に読む。
---

# フロントエンド UI 実装ハーネス

`apps/beatfolio` / `packages/ui` に UI を足すときの**手順**と、**docs に書かれていない運用知**をまとめる。

> **このファイルは規範ではない。**
> 設計規範は `docs/` にある。ここに規範を書き写さない（二重管理になり、必ず片方が腐る）。
> このファイルが持つのは「どの順で作業するか」「どの規範をいつ読むか」「何で毎回ハマるか」だけ。

## 0. 着手前（必須）

**まず読む。読まずに実装を始めない。** 順序は「何を作るか → どう作るか」。

1. `docs/README.md` — 索引。規範は `docs/product/` と `docs/architecture/` のみ。
   `docs/plans/` と `docs/discussions/` は**規範ではない**ので判断の根拠にしない。
2. `docs/product/design-core.md` — すべての設計判断の最上位。迷ったときの最終参照先。
3. `docs/product/flow-design.md` → `docs/product/profile-information-design.md` — 動線と情報設計。
4. 実装する領域の規範（下の対応表から辿る）
5. `.claude/rules/code-review-checklist.md` — 横断のレビュー観点

守ること:

- **設計ドキュメントが規範、既存コードは実装結果。** 食い違ったら勝手に既存へ合わせず、**ユーザーに共有して方針確認**（CLAUDE.md）。
- 規範が存在しない設計判断が出てきたら、**コードに落とす前に docs 側を整える方向で相談する**（CLAUDE.md）。
- **情報設計／動線を先に固める。** 何を・どの順で・どこまで開示するかが決まる前に部品を作り始めない（[[feedback_business_design_before_ai]]）。必要なら素の HTML で動線を確認してから React 化する。
- **コミットはユーザーに明示的に言われるまでしない。**

## 1. 実装順序（Atomic Design＝部品から外側へ）

```
情報設計/動線の確定
  → 不足 primitive を shadcn add
  → atoms → molecules → organisms
  → BFF route（read/write）
  → app（page.tsx = server / ClientAdapter / hook）
  → Storybook（描画する atom/molecule/organism 全部）
```

## 2. 各ステップで読む規範

書いてある内容をここに写さない。**着手直前にそのドキュメントを開く。**

| ステップ                        | 読む規範                                                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 画面を足す / URL を決める       | `docs/architecture/frontend/routing.md`                                                                                     |
| データ取得・更新の経路          | `docs/architecture/frontend/bff/design.md`                                                                                  |
| 表示語彙（ラベル・選択肢）      | `docs/architecture/frontend/bff/design.md`（BFF で解決）+ `docs/architecture/server/database/design.md`（出所は DB マスタ） |
| atom / molecule / organism 分割 | `docs/architecture/frontend/ui/component-design.md`                                                                         |
| `"use client"` の境界           | `docs/architecture/frontend/ui/component-design.md`                                                                         |
| フォーム（RHF + zod）           | `docs/architecture/frontend/ui/form-design.md`                                                                              |
| primitive の追加                | `docs/architecture/frontend/ui/ui-library.md`                                                                               |
| 色・スタイル                    | `docs/architecture/frontend/ui/tailwind.md`                                                                                 |
| レスポンシブ                    | `docs/architecture/frontend/ui/responsive.md`                                                                               |
| Storybook                       | `docs/architecture/frontend/ui/storybook.md`                                                                                |
| 状態を持たせる判断              | `docs/architecture/frontend/state-management.md`                                                                            |

## 3. 検証（完了の定義）

```bash
cd packages/ui && npx tsc --noEmit          # 型
cd apps/beatfolio && npx tsc --noEmit       # アプリ側を変更したなら
cd apps/beatfolio && npx vitest run         # テスト
cd apps/beatfolio && npx next build         # ルート構成の検証（新しい page を足したとき）
cd packages/ui && npm run storybook         # 目視（:6006）
```

- 描画する atom/molecule/organism すべてに `index.stories.tsx` があるか。
- **実装後、`Agent` を1本立てて diff を敵対的にレビューさせる。** 自分の実装を自分で見ると、意図が見えているぶん盲点が残る。

## 4. docs に書かれていない運用知

ここだけが、このファイル固有の価値。

- **worktree で作業するなら `npm install` をその場で実行する。** monorepo の依存は worktree に hoist されない。
- **`npx shadcn@latest add` は `packages/ui` で実行する**（`components.json` がそこにある）。ネットワークが要る。生成物は改変せず `primitives/index.ts` に export を足す。
- **`Image` atom は `react-lazy-load-image-component`（クラスコンポーネント）依存で、RSC から直接描画するとビルドが落ちる。** `Super expression must either be null or a function` が出たらこれ。app 側に ClientAdapter を1枚挟む。
- **`Typography` は `className` を受け付けない。** 構造スタイルを足したくなったら、それは呼び出し側で包むか `variant` / `tone` 軸を増やす合図。
- **`next build` はルートの衝突や RSC 境界の破綻を検出する。** `tsc` とテストが通っても build で落ちることがあるので、page を足したら必ず走らせる。
- **削除したルートへのリンクが残ると 404 になる。** ルートを消したら `grep -rn 'href="/削除したパス"'` で参照を掃除する。
- **root の eslint 設定が `eslint-plugin-storybook` を要求する。** 未インストールの環境では lint が動かない（コード起因ではない）。

## 5. やりがちな失敗

- 情報設計が決まる前に部品を作り始める（動線 → 項目 → 部品の順）。
- モックのアドホックカラーをそのまま実装に持ち込む。
- 一部のコンポーネントだけ story を書いて満足する。
- 言われていないのにコミットする。
