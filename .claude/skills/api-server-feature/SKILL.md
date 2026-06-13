---
name: api-server-feature
description: api-server（クリーンアーキテクチャ + 純粋 Domain + DI）に新しいバックエンド機能/エンドポイントを実装するときの手順とレビュー観点のハーネス。新しい集約・usecase・エンドポイント・DBスキーマ変更に着手する前に読む。
---

# api-server バックエンド実装ハーネス

`apps/api-server` に機能を足すときの「順序」と「毎回ハマる/見落とす観点」をまとめた手順書。
規範ドキュメントの置き換えではなく、**着手前のチェックリスト**として使う。

## 0. 着手前（必須）

- `docs/server-architecture/architecture.md` と、対象領域の設計ドキュメント（`docs/.../*.md`）を**先に読む**。
- 横断観点は `.claude/rules/code-review-checklist.md` を読む（N+1 / 権限 / 過剰取得 / インターフェース設計 / §14 コメントを残さない / §15 Optional フォールバックで必須値を偽装しない）。
- **設計ドキュメントが規範、既存コードは実装結果**。両者が食い違ったら、勝手に既存へ合わせず **ユーザーに共有して方針確認**（CLAUDE.md）。
- ドキュメントに答えがある問いを、ユーザーに質問しない。まず docs を grep する。
- 作業は `git worktree` で別ブランチを切る。worktree は依存が無いので **`npm install` をその場で実行**（monorepo は worktree に hoist されない）。
- **コミットはユーザーに明示的に言われるまでしない。**

## 1. 実装順序（依存方向＝内側から外側へ）

```
DBスキーマ + migration → VO → entity(型) → behaviors → factory
  → policy → repository(interface) → repository(impl) → container
  → usecase → route → errorMap → 認証スコープ
```

各 module を作ったら **同階層に `index.test.ts` を必ず置く**（[[feedback_test_every_module]]）。

## 2. レイヤー別の勘所

### DB スキーマ / migration（`packages/database`）
- 多値（ジャンル・SNS・タグ等）は **JSON でなく 1:N テーブル**（[[feedback_db_relational_not_flat]]）。
- 下書き保存を許す項目は **nullable**。必須性は「保存時」でなく **公開/確定時の policy** で判定する。
- `npm run db:generate -w database` で差分生成（**オフライン**だが drizzle.config が `DATABASE_URL` を要求するのでダミーを渡す）。SQL は手書きしない。
- 既存カラムの nullable 化など型変更は **既存 repository を壊す**（`string` → `string | null`）。`tsc` で波及を確認。

### Value Object
- 1 概念 1 VO。`zod` で形式・長さ・範囲を検証し、`createTypedError` で型付きエラーを投げる。
- **値だけで完結する検証のみ**。一意性・他リソース参照・権限は VO でなく policy/usecase。
- 任意項目は「空文字/空白 → null」に正規化してから VO 化（下書き許容）。

### entity / behaviors / factory
- class を使わない。**クロージャで state を隠蔽**、振る舞いは getter 中心（貧血症と混同しない＝カプセル化目的）。
- factory は `createX`（新規・ID 生成）と `reconstructX`（DB 復元・ID/フラグを引数受け取り）の 2 種。
- 永続化は `toPersistence()`、表示は `toView()` のように **プリミティブへ変換する振る舞い**で出す（内部 VO 構造を外に漏らさない）。

### policy / domain service
- policy は**純粋関数**。Repository を呼ばない。呼び出し元（usecase）が fetch して渡す。
- 複数 Entity の組み立てが絡むときだけ domain service。単一ルールは policy で完結。

### repository
- interface は `domain/{obj}/repositories`、実装は `infrastructure/repositories/{obj}`。実装は必ず `reconstructX` で Entity を返す。
- `tx?: TransactionContext` を受け、`const executor = tx ?? db` パターン。
- **N+1 / 過剰取得 / スコープ条件**を必ず確認：ループ内クエリ禁止、件数は `count()`、一覧は必要カラムだけ、`teamId`/`userId` 等の引数は必ず where に入れる。
- 集計・整形・フィルタは **SQL 側**で完結（取得後に `.map`/`.filter` で加工しない）。

### usecase
- `fetch → (policy/domain service) → save` の配線だけ。ドメイン判定を書かない。
- Entity の**振る舞い**で組み立てる（repo の生データに直接依存しない）。
- 原子性が必要なら `txRunner.run` でトランザクション境界を張る（集約境界 ≠ トランザクション境界）。
- VO の形式エラーはトランザクション開始**前**に出るよう、入力 VO 化を先頭で行うか factory に委ねる。

### route（`app/api/[[...route]]`）
- **ハンドラ構成は `{resource}/{get,post}/index.ts`**：HTTP メソッド名のディレクトリ（`get/` `post/`）配下の `index.ts` に、**1 ユニット = 1 エンドポイント（1 メソッド + 1 パス）**で分離する（[[feedback_api_route_one_file_per_endpoint]]）。`get.ts`/`post.ts` の単一ファイル形ではなく**ディレクトリ + `index.ts`**（プロジェクト共通の構成に揃える）。`save/` 等の独自アクション名ディレクトリは作らない。
  - 例: `profiles/get/index.ts`(一覧) / `profiles/post/index.ts`(作成) / `profiles/detail/get/index.ts`(詳細 `/:id`) / `profiles/detail/post/index.ts`(更新) / `profiles/detail/publish/post/index.ts`(公開アクション)
  - 各 `index.ts` は単一メソッドの Hono app を `default export`。`route.ts` が該当 base path にマウント（同一パスの GET/POST は同じ base に複数回 `.route()`）。`:param` 系は記述的なパスディレクトリ名（`detail/` 等）。
  - 各メソッドディレクトリに `index.test.ts` を置く（[[feedback_test_every_module]]）。
- **GET と POST のみ**（PUT/DELETE 不使用）。削除等は `/x/delete`（POST + パス接尾辞）でアクションを明示。複数形リソース名。
- 認証・バリデーション（zod + `validateRequest`）・レスポンス整形だけ。ロジックは usecase へ。
- **公開エンドポイント**を足すときは要注意：`route.ts` は `*` に `requireAuthMiddleware` を当てている。公開ルートを開けるには auth を**保護プレフィックスにスコープ化**し、公開ルートを外す。
- 静的ルート（`/me/...`）を**パラメータルート（`/:id`）より先に**登録する。

### errorMap
- 新しい policy/VO の型付きエラーは `AppError` union と `errorMap` の両方に追加（status / message / 必要なら details）。

## 3. 検証（完了の定義）

```bash
npm test -- --filter api-server          # 全テスト green
cd apps/api-server && npx tsc --noEmit    # 型（vitest は esbuild なので型は別途）
cd apps/api-server && npx next lint       # lint
```

- 新規 module すべてに test があるか（VO/behaviors/factory/policy/usecase/repository）。型だけの module（entity の型・repo interface）は対象外。
- `tsc` の既存エラー（無関係なテストモック等）と、自分の変更起因のエラーを切り分ける（`git status` で diff 範囲を確認）。

## 4. やりがちな失敗

- ドキュメントに書いてある仕様をユーザーに聞いてしまう → まず grep。
- worktree で `npm install` を忘れて `drizzle-kit: command not found`。
- nullable 化の波及を `tsc` で見ずにテストだけ通して見逃す（vitest は型を見ない）。
- 公開ルートを足したのに `*` の auth に阻まれる。
- 一部 module だけテストを書いて満足する（全 module 必須）。
- 必須値を `?? ""` / `?? 0` 等で埋めて型安全を壊す（欠落は VO/policy/usecase で明示的に落とす。§15）。
- コードの言い換えコメントを書く（命名・構造で表し、理由は `docs/` へ。§14）。
- 言われていないのにコミットする。
