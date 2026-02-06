# MVP ロードマップ - フェーズ1: プレイヤー紹介

## 概要

フェーズ1のMVPは「プレイヤー紹介機能」の実現に焦点を当てる。
ユーザーが登録し、プレイヤーとしてプロフィールを作成・公開できる状態をゴールとする。

## 現状

### 実装済み

| レイヤー | 機能 | 状態 |
|---------|------|------|
| api-server | User Entity / Value Objects / Factory / Behaviors | 済 |
| api-server | `POST /api/users/create` | 済 |
| api-server | Auth0 認証 Middleware | 済 |
| api-server | UserRepository (save, findBySub) | 済 |
| api-server | CreateUser UseCase（冪等性あり） | 済 |
| database | users テーブル | 済 |
| beatfolio | Auth0 Login / Logout | 済 |
| beatfolio | オンボーディング画面（API接続済み） | 済 |
| ui | プレイヤー一覧/詳細ページ（モックデータ） | 済 |
| ui | イベント一覧/詳細ページ（モックデータ） | 済 |
| ui | 管理画面（モックデータ） | 済 |

### 未実装（MVPに必要）

- ユーザー登録フローの完成（未登録検知・リダイレクト）
- プレイヤープロフィールのドメイン設計・API・DB
- プレイヤー一覧/詳細のDB連携（モック → 実データ）
- 公開ページの整備

## ステップ

### Step 1: ユーザー登録フローの完成

ログインからプロフィール作成までの一連の流れを完成させる。

```
Auth0 signup → beatfolio → 未登録検知 → /onboarding → DB保存 → home
```

#### 着手前に設計が必要な事項

- `GET /api/users/me` のレスポンス形式（どのユーザー情報を返すか）
- 未登録検知のタイミング（Middleware で行うか、ページ側で行うか）
- オンボーディングで収集する項目の確定（現状は username と accountId のみ）
- 登録済みユーザーが `/onboarding` にアクセスした場合の振る舞い

#### タスク

| タスク | アプリ | 詳細 |
|--------|-------|------|
| `GET /api/users/me` 実装 | api-server | セッションの sub からユーザー情報を取得するエンドポイント |
| `requireRegisteredMiddleware` 実装 | api-server | DB登録済みかチェックする Middleware |
| ログイン後の未登録リダイレクト | beatfolio | `/api/users/me` を呼び、未登録なら `/onboarding` へリダイレクト |
| 登録済みユーザーのオンボーディングスキップ | beatfolio | 登録済みなら `/onboarding` をスキップして home へ |

### Step 2: プレイヤープロフィールのドメイン設計

MVPの核となるプレイヤーデータモデルを設計・実装する。

#### 着手前に設計が必要な事項

- Player Profile Entity のフィールド定義（活動名、活動地域、スキル、経歴、SNSリンク等、MVPで必要な項目の取捨選択）
- User と Player Profile の関係（1:1 か 1:N か）
- Value Objects の設計（どのフィールドに独自のバリデーションが必要か）
- `player_profiles` テーブルのスキーマ設計（カラム型、制約、インデックス）
- プロフィール作成・編集画面のフォーム項目とバリデーションルール

#### タスク

| タスク | アプリ | 詳細 |
|--------|-------|------|
| Player Profile Entity 設計 | api-server | 活動名、活動地域、スキル、経歴、SNSリンク等 |
| `player_profiles` テーブル追加 | database | マイグレーション作成・適用 |
| プロフィール作成 API | api-server | `POST /api/players` |
| プロフィール更新 API | api-server | `POST /api/players/:id` |
| プロフィール取得 API | api-server | `GET /api/players/:id` |
| プロフィール作成・編集画面 | beatfolio | フォームUI、API連携 |

### Step 3: プレイヤー一覧・詳細のDB連携

UIのモックデータを実データに切り替える。

#### 着手前に設計が必要な事項

- 一覧 API の検索・フィルタ仕様（どのフィールドで絞り込むか、全文検索の要否）
- ソート条件の定義（名前順、登録日順、地域順 等）
- ページネーション方式の選定（offset-based か cursor-based か）
- 既存モック UI のデータ構造と API レスポンス形式の差分整理

#### タスク

| タスク | アプリ | 詳細 |
|--------|-------|------|
| プレイヤー一覧取得 API | api-server | `GET /api/players`（検索・フィルタ・ソート・ページネーション） |
| プレイヤー詳細取得 API | api-server | `GET /api/players/:id`（公開プロフィール） |
| 一覧ページの API 連携 | beatfolio | モックデータ → API呼び出しに切り替え |
| 詳細ページの API 連携 | beatfolio | モックデータ → API呼び出しに切り替え |

### Step 4: 公開ページの整備

未ログインユーザーでもプレイヤー情報を閲覧できるようにする。

#### 着手前に設計が必要な事項

- 認証不要で公開する API エンドポイントの範囲（一覧・詳細どこまで公開するか）
- 公開情報と非公開情報の境界（プロフィールのどの項目を未ログインユーザーに見せるか）
- SEO 要件の整理（OGP に含める情報、動的メタデータの生成方式）

#### タスク

| タスク | アプリ | 詳細 |
|--------|-------|------|
| 公開 API（認証不要）の整備 | api-server | プレイヤー一覧・詳細を認証なしで取得可能にする |
| 未ログイン時のUI調整 | beatfolio | ヘッダー、CTA（ログインボタン）の表示切り替え |
| SEO対応 | beatfolio | メタデータ、OGP設定 |

## 優先順位

```
Step 1（ユーザー登録フロー）
  ↓  ユーザーがDBに存在しないと後続が成り立たない
Step 2（プレイヤープロフィール設計）
  ↓  データモデルがないとAPI・UIが作れない
Step 3（DB連携）
  ↓  実データで動くプレイヤー紹介
Step 4（公開ページ）
     MVPとして外部公開できる状態
```

## 関連ドキュメント

- [architecture.md](./architecture.md) - api-server アーキテクチャ
- [authentication.md](./authentication.md) - 認証・ユーザー登録設計
- [api-design-guidelines.md](./api-design-guidelines.md) - API設計ガイドライン
