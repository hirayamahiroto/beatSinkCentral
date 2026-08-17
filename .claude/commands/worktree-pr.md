---
description: beatSinkCentral 専用。計画済みの変更を独立ワークツリーで実装→検証→ドラフト PR まで一気通貫で行う
argument-hint: <Issue URL/番号 | docs/plans/*.md のパス | 実装内容そのもの>
---

# worktree-pr (beatSinkCentral 専用)

`$ARGUMENTS` に渡された実装プラン（GitHub Issue、`docs/plans/*.md` のパス、または実装内容そのもの）を、
**メインの作業ツリーを汚さずに** 独立した git worktree で実装し、検証してドラフト PR まで作る。

このコマンドは beatSinkCentral (`/Users/hirayamahiroto/dev/myProjects/beatSinkCentral`) 専用。
他リポジトリで呼ばれた場合は、その旨を伝えて中断すること。

## 前提・既知の落とし穴（必ず守る）

- **`EnterWorktree` ツールは使わない**。`.claude/worktrees/` 配下にできる worktree は編集ロックされ、かつ
  `.gitignore` されている（`.claude/worktrees/fix-bff-error-handling` がその残骸）。
  `git worktree add` で **リポジトリの兄弟ディレクトリ** `../beatSinkCentral-<slug>` に作る（既存の worktree 群と同じ命名）。
- **worktree には `node_modules` が無い**。typecheck / test / build の前に必ずルートで `npm ci` を実行する。
- **`.env.local` は gitignore されている**ため worktree にコピーしないと `next build` が落ちる。
  作成直後にメインリポからコピーする（下記手順 2）。
- **フォーマッタは prettier**（設定ファイル無し = デフォルト、printWidth 80）。
  - リポジトリ全体に `npm run format` を当てない。**無関係ファイルを巻き込んで差分が膨らむ**。
  - 原則は **論理変更のみを周囲のスタイルに合わせて手で書き**、整形は pre-commit の lint-staged
    （staged ファイルにのみ `prettier --write`）に委ねる。
  - 明示的に確認したいときだけ `npx prettier --check <変更ファイル>`。
  - 巻き込み整形が出たら一度 `git checkout -- <files>` で破棄し、論理変更だけを再適用して差分を最小化する。
- **`CLAUDE.md` の「設計ドキュメントが規範、既存コードは実装結果」を守る**。実装着手前に該当領域の `docs/` を読む。
  - api-server 側の変更 → `/api-server-feature` スキルを先に読む
  - beatfolio / packages/ui 側の変更 → `/frontend-feature` スキルを先に読む
  - ドキュメントと既存コードが食い違う場合は勝手に合わせず、ユーザーに共有して方針を確認する
- `.claude/rules/code-review-checklist.md` を遵守する（特に 🔴: スコープ条件・権限露出・トランザクション境界・型安全）。
- コメントは残さない（命名・構造で表現）。`?? フォールバック` で必須値を埋めない。

## 手順

### 1. プラン把握とスコープ確定

- `$ARGUMENTS` が Issue URL / 番号なら `gh issue view <n> --json title,body,comments` で読む。
  ファイルパスならそれを `Read`。インライン記述ならそれを計画とする。
- 変更対象ファイルを `Read` / `Grep` で特定し、**波及先**（共有スキーマ、`AppType` を消費する BFF 側、
  `packages/ui` を使う app 側）を洗い出す。
- 該当領域の設計ドキュメントを読む（`docs/README.md` が索引、`CLAUDE.md` に読み順の表がある）。
- 不明点があれば実装前に確認する。深掘りが要るなら `Explore` / `general-purpose` エージェントへ委譲。

### 2. ワークツリー作成

- ブランチ名は変更内容に応じて `feat/...` `refactor/...` `fix/...` `docs/...` `chore/...`（直近コミットの命名に倣う）。
- 実行（**base は `main`**）:

  ```bash
  git worktree add -b <branch> ../beatSinkCentral-<slug> main
  ```

- 依存と環境変数をワークツリーに入れる:

  ```bash
  cd ../beatSinkCentral-<slug>
  npm ci
  cp ../beatSinkCentral/apps/api-server/.env.local apps/api-server/.env.local
  cp ../beatSinkCentral/apps/beatfolio/.env.local apps/beatfolio/.env.local
  cp ../beatSinkCentral/packages/database/.env packages/database/.env
  ```

  存在しないものはスキップしてよい。変更範囲に関係するものだけで足りる。

### 3. 実装

- ワークツリー配下のファイルだけを編集する（メインリポは触らない）。
- 論理変更のみ。テストは変更したモジュールすべてに書く（VO / behaviors / policy / usecase / repository / hook / adapter）。

### 4. 検証（すべて green になるまで）

ワークツリー内で実行する。**CI（`.github/workflows/{api-server,beatfolio}.yml` の lint → build → test）を先回りする**のが目的。

| 項目      | コマンド                                                     |
| --------- | ------------------------------------------------------------ |
| typecheck | `cd apps/<app> && npx tsc --noEmit`                          |
| lint      | `npx turbo run lint --filter=<pkg>`                          |
| test      | `cd apps/<app> && npx vitest run`（`packages/<pkg>` も同様） |
| build     | `npx turbo run build --filter=<pkg>`                         |
| format    | `npx prettier --check <変更ファイル>`                        |

- `npx vitest run` を使う（`npm test` は watch に入りうる）。
- **`AppType`（Hono RPC）に触れる変更では、api-server と beatfolio の両方で typecheck を通す**。
- 差分確認: `git diff --stat` で **無関係行の巻き込みが無い**ことを確認する。

### 5. コミット

- `git add -A && git commit` で **husky pre-commit（lint-staged の prettier）を必ず通す**（`--no-verify` 禁止）。
- メッセージは Conventional Commits（日本語可）。スコープは `api-server` / `beatfolio` / `ui` / `database` など。
- 末尾に必ず:

  ```
  Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
  ```

### 6. プッシュ & ドラフト PR

- `git push -u origin <branch>`
- `gh pr create --draft --base main` で作成。
- このリポジトリに PR テンプレートは無い。**直近 PR（#205 / #206）の構成に倣う**:

  ```markdown
  ## 概要

  何を・なぜ変えたか。Issue があれば冒頭で対応関係を書く。スコープ外は明示する。

  ## 主な変更

  差分の要点。設計判断は diff ではなく「なぜその置き方か」を書く。責務の置き場が動くなら表にする。

  ## セキュリティ評価

  認証・認可・露出面に触れる変更のときのみ。変更前後で適用範囲が一致することを述べる。

  ## 確認した内容

  | 項目                             | 結果                   |
  | -------------------------------- | ---------------------- |
  | `tsc --noEmit`（<app>）          | パス                   |
  | `vitest run`（<app>）            | N files / M tests パス |
  | `turbo run lint --filter=<pkg>`  | パス                   |
  | `turbo run build --filter=<pkg>` | 成功                   |

  ## Discussion

  レビューで決めたいこと・採らなかった案と理由。

  ## スコープ外

  意図的に触っていない範囲。

  Reference: #<issue>
  ```

- 本文末尾に必ず:

  ```
  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  ```

- Reference の Issue リンクが不明なら空にし、最後にユーザーへ確認する。

### 7. 報告

- PR の URL、ブランチ名、ワークツリーのパス、検証結果サマリを簡潔に返す。
- 後片付けのコマンドを添える: `git worktree remove ../beatSinkCentral-<slug>`（マージ後に実行）。
- コミット・プッシュ・PR は「外向き/不可逆」操作。ユーザーが本コマンドで明示依頼済みなのでそのまま進めてよいが、
  Issue リンク等の未確定事項は最後に確認する。
