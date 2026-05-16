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

## 主要な設計ドキュメント

| 領域                                               | ドキュメント                                        | いつ読むか                                        |
| -------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------- |
| 全体アーキテクチャ・ディレクトリ構造・実装パターン | `docs/server-architecture/architecture.md`          | 新規実装・レイヤー追加時                          |
| API 設計（HTTPメソッド・URL）                      | `docs/server-architecture/api-design-guidelines.md` | API ルート追加・変更時                            |
| エラーハンドリング                                 | `docs/server-architecture/error-handling/README.md` | エラー追加・throw 位置・errorMap 変更時           |
| 並行更新ポリシー                                   | `docs/server-architecture/concurrency.md`           | 新規 usecase の更新フロー設計時・競合挙動の判断時 |
| DB マイグレーション                                | `docs/server-architecture/database-migration.md`    | スキーマ変更時                                    |
| 外部クライアント実装（Next.js 遅延初期化）         | `docs/server-architecture/external-clients.md`      | Database / Auth0 / Redis 等の追加・初期化変更時   |
| 認証                                               | `docs/authentication.md`                            | 認証・認可フローの追加・変更時                    |
| フロントエンド全般                                 | `docs/frontend-architecture/README.md`              | UI 実装時                                         |
| テスト戦略                                         | `docs/testing/strategy.md`                          | テスト追加・テスト方針判断時                      |

各ドキュメントの読み順や粒度は、それぞれの README / 目次に従う。

汎用的なコードレビュー観点（N+1・権限・データ取得最適化・インターフェース設計等）はグローバル設定の `~/.claude/rules/code-review-checklist.md` を参照する。
