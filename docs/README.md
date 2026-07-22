# 設計ドキュメント

## 構成の考え方

ドキュメントを**役割と寿命**で4つに分ける。どこに何を書くかで迷ったら、この表に戻る。

| ディレクトリ                       | 役割                             | 寿命                       |
| ---------------------------------- | -------------------------------- | -------------------------- |
| [`product/`](./product/)           | **何を作るか** — ビジョン・情報設計・動線 | 恒久                       |
| [`architecture/`](./architecture/) | **どう作るか** — 技術規範         | 恒久                       |
| [`plans/`](./plans/)               | **いつ作るか** — ロードマップ・実装計画   | 時限（完了したら参照しない） |
| [`discussions/`](./discussions/)   | **検討中** — 調査・提案・未合意   | 合意したら上の3つへ昇格    |

`plans/` と `discussions/` は**規範ではない**。実装judgeの根拠にしてよいのは `product/` と `architecture/` だけ。

---

## 読む順序

実装に着手する前に、**上から順に**該当するものを読む。

### 1. まず何を作るのかを知る（`product/`）

| ドキュメント                                                          | 内容                                                         |
| --------------------------------------------------------------------- | ------------------------------------------------------------ |
| [設計の中核](./product/design-core.md)                                | **すべての設計判断の最上位**。ビジョン・最初の課題・設計原則 |
| [動線設計](./product/flow-design.md)                                  | ユーザーがどこから来て・どう進み・どこへ抜けるか             |
| [プロフィール情報設計](./product/profile-information-design.md)       | 何を・どう載せ・どこで見せるか（WIP）                        |

判断に迷ったときの最終参照先は `design-core.md`。画面・項目・API のどれを設計するときも、まずここから逆算する。

### 2. 次にどう作るかを知る（`architecture/`）

#### 全体

| 領域           | ドキュメント                                   | いつ読むか                     |
| -------------- | ---------------------------------------------- | ------------------------------ |
| 認証           | [authentication.md](./architecture/authentication.md) | 認証・認可フローの追加・変更時 |

#### フロントエンド — [`architecture/frontend/`](./architecture/frontend/README.md)

| 領域             | ドキュメント                                                       | いつ読むか                       |
| ---------------- | ------------------------------------------------------------------ | -------------------------------- |
| コンポーネント   | [ui/component-design.md](./architecture/frontend/ui/component-design.md) | UI 実装時                        |
| 画面 URL 設計    | [routing.md](./architecture/frontend/routing.md)                   | 画面追加・URL 変更時             |
| BFF              | [bff/design.md](./architecture/frontend/bff/design.md)                           | データ取得・更新の経路設計時     |
| フォーム         | [ui/form-design.md](./architecture/frontend/ui/form-design.md)           | フォーム実装時                   |

その他（`ui/` 配下の Tailwind / Storybook / レスポンシブ、状態管理等）は [frontend/README.md](./architecture/frontend/README.md) の一覧を参照。

#### サーバー — [`architecture/server/`](./architecture/server/architecture.md)

| 領域               | ドキュメント                                                               | いつ読むか                              |
| ------------------ | -------------------------------------------------------------------------- | --------------------------------------- |
| 全体構造           | [architecture.md](./architecture/server/architecture.md)                   | 新規実装・レイヤー追加時                |
| API 設計           | [api-design-guidelines.md](./architecture/server/api-design-guidelines.md) | API ルート追加・変更時                  |
| エラーハンドリング | [error-handling/](./architecture/server/error-handling/README.md)          | エラー追加・throw 位置・errorMap 変更時 |
| 外部クライアント   | [external-clients.md](./architecture/server/external-clients.md)           | Database / Auth0 / Redis 等の追加時     |

DB まわり — [`architecture/server/database/`](./architecture/server/database/design.md)

| 領域                | ドキュメント                                                             | いつ読むか                        |
| ------------------- | ------------------------------------------------------------------------ | --------------------------------- |
| 設計思想            | [design.md](./architecture/server/database/design.md)                    | 種別・分類のモデリング時          |
| マイグレーション    | [migration.md](./architecture/server/database/migration.md)              | スキーマ変更時                    |
| 接続                | [connection.md](./architecture/server/database/connection.md)            | 環境セットアップ・DB エラー調査時 |
| 並行更新            | [concurrency.md](./architecture/server/database/concurrency.md)          | usecase の更新フロー設計時        |

#### テスト・インフラ

| 領域       | ドキュメント                                              | いつ読むか                        |
| ---------- | --------------------------------------------------------- | --------------------------------- |
| テスト戦略 | [testing/strategy.md](./architecture/testing/strategy.md) | テスト追加・方針判断時            |
| インフラ   | [infrastructure/](./architecture/infrastructure/README.md) | Vercel env / GHA Secrets 変更時   |

### 3. 実装の順序を知る（`plans/`）

| ドキュメント                                                | 内容                     |
| ----------------------------------------------------------- | ------------------------ |
| [Phase 1: プレイヤー紹介](./plans/phase1-player-introduction/roadmap.md) | MVP のロードマップと実装計画 |

---

## 書くときのルール

- **設計判断の理由はコードのコメントではなくここに書く**（[code-review-checklist](../.claude/rules/code-review-checklist.md) §13）
- **既存コードと食い違ったらドキュメントが正**。既存に合わせず、ズレを共有して方針を決める
- 該当ドキュメントが無い設計判断が必要になったら、コードに落とす前にドキュメント側を整える
- **時間軸を名前に入れるのは `plans/` の中だけ**。`product/` と `architecture/` は恒久的な名前にする
- 検討中のものは `discussions/` に置き、規範と混ぜない
