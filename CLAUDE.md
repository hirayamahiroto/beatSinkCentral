# CLAUDE.md

このファイルは Claude Code がこのリポジトリで作業する際のガイダンスを提供する。
**設計方針・ルール・実装パターンは本ファイルに直接書かず、`docs/` 配下の各設計ドキュメントに集約する**。CLAUDE.md は参照ハブとして機能する。

## プロジェクト概要

beatSinkCentral は音楽関連サービスのモノレポ。

## よく使うコマンド

```bash
# 開発サーバー起動
npm run dev

# テスト実行
npm test -- --filter api-server

# 特定ディレクトリのテスト
npm test -- --filter api-server -- --run src/domain/users

# ビルド
npm run build
```

## 設計ドキュメントの参照ルール

- 実装着手前に、必ず該当領域の設計ドキュメントを読むこと
- **設計ドキュメントが規範、既存コードは実装結果**。両者が食い違う場合はドキュメントを優先する
- 「既存がそうなっているから」を理由にしない。既存コードがドキュメントとズレている場合は、勝手に合わせずユーザーに共有して方針を確認する
- 該当領域のドキュメントが存在しない設計判断が必要になった場合は、勝手にコードへ落とし込まず、ドキュメント側を整える方向で相談する

## ドキュメントの構成

`docs/` は**役割と寿命**で4分割している。索引は `docs/README.md`。

| ディレクトリ         | 役割                                   | 規範か              |
| -------------------- | -------------------------------------- | ------------------- |
| `docs/product/`      | 何を作るか（ビジョン・情報設計・動線） | ○                   |
| `docs/architecture/` | どう作るか（技術規範）                 | ○                   |
| `docs/plans/`        | いつ作るか（ロードマップ・実装計画）   | ×（時限）           |
| `docs/discussions/`  | 検討中（調査・提案・未合意）           | ×（合意したら昇格） |

実装判断の根拠にしてよいのは `product/` と `architecture/` だけ。

## 主要な設計ドキュメント

### まず読む — プロダクト設計（何を作るか）

| 領域                       | ドキュメント                                 | いつ読むか                                         |
| -------------------------- | -------------------------------------------- | -------------------------------------------------- |
| 設計の中核（最上位の規範） | `docs/product/design-core.md`                | **すべての設計判断の起点**。迷ったときの最終参照先 |
| 動線設計                   | `docs/product/flow-design.md`                | 画面・遷移を設計する時                             |
| プロフィール情報設計       | `docs/product/profile-information-design.md` | 項目・表示内容を決める時                           |

### 次に読む — 技術規範（どう作るか）

| 領域                                                 | ドキュメント                                                      | いつ読むか                                             |
| ---------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| 全体アーキテクチャ・ディレクトリ構造・実装パターン   | `docs/architecture/server/architecture.md`                        | 新規実装・レイヤー追加時                               |
| 認可と権能（capabilities）・トランザクション境界     | `docs/architecture/server/architecture.md#認可と権能capabilities` | usecase の依存を決める時・新しい集約を足す時           |
| API 設計（HTTPメソッド・URL）                        | `docs/architecture/server/api-design-guidelines.md`               | API ルート追加・変更時                                 |
| エラーハンドリング（Result 境界を含む）              | `docs/architecture/server/error-handling/README.md`               | エラー追加・失敗の伝え方・errorMap 変更時              |
| 並行更新ポリシー                                     | `docs/architecture/server/database/concurrency.md`                | 新規 usecase の更新フロー設計時・競合挙動の判断時      |
| DB 設計思想（マスタ参照・DB 由来の表示語彙）         | `docs/architecture/server/database/design.md`                     | 種別/媒体/分類のモデリング・表示語彙の出所を判断する時 |
| DB マイグレーション                                  | `docs/architecture/server/database/migration.md`                  | スキーマ変更時                                         |
| DB 接続パターン（Supabase Pooler / Direct 使い分け） | `docs/architecture/server/database/connection.md`                 | 新環境の DB セットアップ・CI/CD の DB エラー調査時     |
| Supabase Storage（バケット管理・アクセスモデル）     | `docs/architecture/server/database/storage.md`                    | ファイルアップロード機能・バケット追加/変更時          |
| 外部クライアント実装（Next.js 遅延初期化）           | `docs/architecture/server/external-clients.md`                    | Database / Auth0 / Redis 等の追加・初期化変更時        |
| 認証                                                 | `docs/architecture/authentication.md`                             | 認証・認可フローの追加・変更時                         |
| フロントエンド全般                                   | `docs/architecture/frontend/README.md`                            | UI 実装時                                              |
| 画面 URL 設計（遷移・階層・BFF ルート対応）          | `docs/architecture/frontend/routing.md`                           | 画面追加・URL 変更時                                   |
| BFF 設計（read/write の経路・整形責務）              | `docs/architecture/frontend/bff/design.md`                        | データ取得・更新の経路を設計する時                     |
| インフラ管理（Terraform / IaC）                      | `docs/architecture/infrastructure/README.md`                      | Vercel env / GHA Secrets / プラットフォーム設定変更時  |
| テスト戦略                                           | `docs/architecture/testing/strategy.md`                           | テスト追加・テスト方針判断時                           |

各ドキュメントの読み順や粒度は、それぞれの README / 目次に従う。

汎用的なコードレビュー観点（N+1・権限・データ取得最適化・インターフェース設計・コメント方針・型安全な Optional 扱い等）は `.claude/rules/code-review-checklist.md` を参照する。
