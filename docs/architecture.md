# api-server アーキテクチャ

## 概要

api-serverはクリーンアーキテクチャの原則に基づいて設計されています。ドメイン層がフレームワークに依存しない独立した構成となっており、テスタビリティと保守性を重視しています。

## ディレクトリ構造

```
apps/api-server/src/
├── app/api/[[...route]]/     # Hono ルーティング（プレゼンテーション層）
│   ├── route.ts              # メインルーター
│   ├── test/                 # GET/POST /api/test
│   └── users/create/         # POST /api/users/create
│
├── domain/                   # ドメイン層（オブジェクト単位のコンポジション構造）
│   └── users/                # ユーザードメイン
│       ├── entities/         # User エンティティ
│       ├── repositories/     # IUserRepository インターフェース
│       └── valueObjects/     # 値オブジェクト
│           ├── Auth0UserId/
│           ├── Email/
│           └── Username/
│
├── usecases/                 # ユースケース層（アプリケーション層）
│   └── users/                # CreateUserUseCase
│
├── infrastructure/           # インフラストラクチャ層
│   ├── auth0/                # Auth0 クライアント
│   └── repositories/         # リポジトリ実装
│
├── middlewares/              # ミドルウェア
│   ├── auth0/                # Auth0 認証・メール検証
│   └── basicAuth/            # ベーシック認証
│
└── utils/                    # ユーティリティ
    ├── client/               # Hono クライアント生成
    └── config/               # 設定管理
```

### ドメイン層の構造について

ドメイン層はオブジェクト単位のコンポジション構造を採用しています。

```
# 従来の構造（レイヤー単位）
domain/{layer}/{object}/

# 現在の構造（オブジェクト単位）
domain/{object}/{layer}/
```

この構造により、関連するコードが近くに配置され、ドメインオブジェクトの凝集度が高まります。

## レイヤー構成

```
┌─────────────────────────────────────┐
│   API Routes (Hono)                 │  ← プレゼンテーション層
├─────────────────────────────────────┤
│   Middlewares (認証・検証)            │  ← アプリケーション層
├─────────────────────────────────────┤
│   UseCases (ビジネスロジック)          │  ← アプリケーション層
├─────────────────────────────────────┤
│   Repository Interface (抽象)        │  ← ドメイン層
├─────────────────────────────────────┤
│   Entities & Value Objects          │  ← ドメイン層
├─────────────────────────────────────┤
│   Infrastructure (DB, Auth0)        │  ← インフラストラクチャ層
└─────────────────────────────────────┘
```

## 依存関係の方向

依存関係は常に内側（ドメイン層）に向かいます。

```
API Handlers
  ├─→ Middlewares (Auth0, BasicAuth)
  ├─→ CreateUserUseCase
  │    └─→ IUserRepository (interface)
  │         └─→ User Entity
  │              └─→ Value Objects (Auth0UserId, Email, Username)
  └─→ Infrastructure (Auth0 client)
```

## 各層の責務

### プレゼンテーション層 (`app/api/`)

HTTPリクエスト/レスポンスの処理を担当。

- ルーティング定義
- リクエストバリデーション（Zod）
- レスポンス整形

### ミドルウェア層 (`middlewares/`)

横断的関心事を処理。

| ミドルウェア | 責務 |
|-------------|------|
| `requireAuthMiddleware` | Auth0 セッション検証 |
| `requireVerifiedMiddleware` | メールアドレス検証チェック |
| `basicAuthMiddleware` | ベーシック認証（オプション） |

### ユースケース層 (`usecases/`)

ビジネスロジックを実装。ドメイン層の外側に配置し、ドメインオブジェクトを組み合わせてユースケースを実現。

```typescript
// CreateUserUseCase の責務
- Auth0ユーザーIDで既存ユーザーをチェック
- 既存の場合は既存ユーザーを返す（冪等性）
- 新規の場合は新しいユーザーを作成
```

### リポジトリ層 (`domain/{object}/repositories/`)

データアクセスの抽象化。

```typescript
interface IUserRepository {
  create(params: CreateUserParams): Promise<User>;
  findByAuth0UserId(auth0UserId: string): Promise<User | null>;
}
```

### エンティティ層 (`domain/{object}/entities/`)

ビジネスルールを持つドメインオブジェクト。interface + ファクトリ関数パターンで実装。

```typescript
// 型定義
export type User = {
  readonly auth0UserId: string;
  readonly email: string;
  readonly username: string;
  readonly attributes: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

// ファクトリ関数（バリデーション付き）
export const createUser = (params: CreateUserParams): User => {
  const auth0UserId = createAuth0UserId(params.auth0UserId);
  const username = createUsername(params.username);
  const email = createEmail(params.email);
  // ...
};
```

### 値オブジェクト層 (`domain/{object}/valueObjects/`)

ドメインオブジェクトで使用される不変でバリデーションを持つ値。各ドメイン内に配置。

| 値オブジェクト | 責務 |
|---------------|------|
| `Auth0UserId` | Auth0ユーザーID（空文字禁止） |
| `Email` | メールアドレス形式バリデーション（最大254文字） |
| `Username` | ユーザー名（空文字禁止、最大255文字、トリム処理） |

#### 値オブジェクトの実装パターン

interface + ファクトリ関数パターンを採用。

```typescript
// 型定義
export interface Username {
  readonly value: string;
}

// ファクトリ関数（バリデーション内包）
export const createUsername = (value: string): Username => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error("username is required");
  }
  if (trimmed.length > 255) {
    throw new Error("username must be 255 characters or less");
  }
  return { value: trimmed };
};

// JSON変換
export const usernameToJson = (username: Username): string => username.value;
```

### インフラストラクチャ層 (`infrastructure/`)

外部サービスとの連携。

- Auth0 クライアント設定
- リポジトリ実装（データベースアクセス）

## 使用技術

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 15 (App Router) + Hono 4 |
| 認証 | @auth0/nextjs-auth0 |
| バリデーション | Zod + @hono/zod-validator |
| テスト | Vitest |
| 言語 | TypeScript 5 |

## 設計パターン

1. **クリーンアーキテクチャ**: ドメイン層がフレームワークに依存しない
2. **DDD**: エンティティ、値オブジェクトの実装
3. **関数型アプローチ**: interface + ファクトリ関数パターン
4. **リポジトリパターン**: インターフェース経由のデータアクセス抽象化
5. **ユースケースパターン**: ビジネスロジックの分離

### なぜ関数型アプローチを採用するか

| 観点 | class | interface + 関数 |
|------|-------|-----------------|
| Tree Shaking | 使わないメソッドも含まれる | 使う関数だけimport |
| TypeScript相性 | 型とインスタンスの区別が必要 | 型推論が効きやすい |
| テスト | モック/スパイが必要な場合あり | 純粋関数で直接テスト |
| 不変性 | ミュータブル（内部変更） | イミュータブル（新オブジェクト返却） |

## テスト方針

各層の責務を分離し、テストの重複を避ける。

```
User Entity テスト
├── IO確認（入力パラメータ → 出力User）
└── 値オブジェクト呼び出し確認（spy）

Value Objects テスト
├── Auth0UserId: バリデーション詳細
├── Username: バリデーション詳細
└── Email: バリデーション詳細
```

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET/POST | `/api/test` | ヘルスチェック |
| POST | `/api/users/create` | ユーザー作成 |
