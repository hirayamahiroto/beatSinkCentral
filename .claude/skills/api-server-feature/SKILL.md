---
name: api-server-feature
description: api-server（クリーンアーキテクチャ + 純粋 Domain + DI）に新しいバックエンド機能/エンドポイントを実装するときの手順とレビュー観点のハーネス。新しい集約・usecase・エンドポイント・DBスキーマ変更に着手する前に読む。
---

# api-server バックエンド実装ハーネス

`apps/api-server` に機能を足すときの**手順**と、**docs に書かれていない運用知**をまとめる。

> **このファイルは規範ではない。**
> 設計規範は `docs/` にある。ここに規範を書き写さない（二重管理になり、必ず片方が腐る）。
> このファイルが持つのは「どの順で作業するか」「どの規範をいつ読むか」「何で毎回ハマるか」だけ。

## 0. 着手前（必須）

**まず読む。読まずに実装を始めない。**

1. `docs/README.md` — 索引。規範は `docs/product/` と `docs/architecture/` のみ。
   `docs/plans/` と `docs/discussions/` は**規範ではない**ので判断の根拠にしない。
2. `docs/product/design-core.md` — 何を作るか。すべての設計判断の最上位。
3. `docs/architecture/server/architecture.md` — どう作るか。レイヤー責務・依存方向。
4. 実装する領域の規範（下の対応表から辿る）
5. `.claude/rules/code-review-checklist.md` — 横断のレビュー観点

守ること:

- **設計ドキュメントが規範、既存コードは実装結果。** 食い違ったら勝手に既存へ合わせず、**ユーザーに共有して方針確認**（CLAUDE.md）。
- 規範が存在しない設計判断が出てきたら、**コードに落とす前に docs 側を整える方向で相談する**（CLAUDE.md）。
- ドキュメントに答えがある問いを、ユーザーに質問しない。まず `docs/` を grep する。
- **コミットはユーザーに明示的に言われるまでしない。**

## 1. 実装順序（依存方向＝内側から外側へ）

```
DBスキーマ + migration → VO → entity(型) → behaviors → factory
  → policy → repository(interface) → repository(impl) → container
  → usecase → route → errorMap → 認証スコープ
```

各 module を作ったら **同階層に `index.test.ts` を必ず置く**（[[feedback_test_every_module]]）。
型だけの module（entity の型定義・repository interface）は対象外。

## 2. 各ステップで読む規範

書いてある内容をここに写さない。**着手直前にそのドキュメントを開く。**

| ステップ                    | 読む規範                                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| DB スキーマ設計             | `docs/architecture/server/database/design.md`（マスタ参照・DB 由来の表示語彙）                              |
| migration 実行              | `docs/architecture/server/database/migration.md`                                                            |
| 複数レコードの同時更新      | `docs/architecture/server/database/concurrency.md`                                                          |
| VO / entity / policy        | `docs/architecture/server/architecture.md`                                                                  |
| repository（クエリ設計）    | `.claude/rules/code-review-checklist.md` §1 N+1 / §2 過剰取得 / §3 スコープ条件 / §8 SQL とアプリの責務分離 |
| usecase（トランザクション） | `.claude/rules/code-review-checklist.md` §10 トランザクション境界                                           |
| route（URL・メソッド）      | `docs/architecture/server/api-design-guidelines.md`                                                         |
| errorMap                    | `docs/architecture/server/error-handling/README.md`                                                         |
| 外部クライアントの初期化    | `docs/architecture/server/external-clients.md`                                                              |
| 認証・認可                  | `docs/architecture/authentication.md`                                                                       |
| テストの書き方              | `docs/architecture/testing/strategy.md`                                                                     |

## 3. 検証（完了の定義）

```bash
npm test -- --filter api-server           # 全テスト green
cd apps/api-server && npx tsc --noEmit    # 型（vitest は esbuild なので型を見ない）
cd apps/api-server && npx next lint       # lint
```

- 新規 module すべてに test があるか。
- `tsc` の**既存エラー**（無関係なテストモック等）と**自分の変更起因**のエラーを切り分ける（`git status` で diff 範囲を確認）。

## 4. docs に書かれていない運用知

ここだけが、このファイル固有の価値。

- **worktree で作業するなら `npm install` をその場で実行する。** monorepo の依存は worktree に hoist されないため、忘れると `drizzle-kit: command not found` になる。
- **`npm run db:generate -w database` はオフラインで動くが、`drizzle.config` が `DATABASE_URL` を要求する。** ダミー値を渡せば通る。SQL は手書きしない。
- **vitest は型を見ない。** nullable 化のような型変更の波及は、テストが緑でも壊れている。必ず `tsc` を別途走らせる。
- **公開エンドポイントを足すときは `route.ts` の認証適用範囲を確認する。** `*` に `requireAuthMiddleware` が当たっていると、公開したいルートも弾かれる。auth を保護プレフィックスにスコープ化する。
- **静的ルート（`/me/...`）はパラメータルート（`/:id`）より先に登録する。** 逆だと静的パスがパラメータに食われる。

## 5. やりがちな失敗

- ドキュメントに書いてある仕様をユーザーに聞く → まず grep。
- 一部 module だけテストを書いて満足する（全 module 必須）。
- 型変更の波及を `tsc` で見ずにテストだけで判断する。
- 言われていないのにコミットする。
