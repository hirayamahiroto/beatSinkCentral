# api-server アーキテクチャ

## 概要

api-serverはクリーンアーキテクチャの原則に基づいて設計されています。ドメイン層がフレームワークに依存しない独立した構成となっており、テスタビリティと保守性を重視しています。

## ディレクトリ構造

```
apps/api-server/src/
├── app/api/[[...route]]/     # Hono ルーティング（プレゼンテーション層）
│   ├── route.ts              # メインルーター
│   ├── user/create/          # POST /api/user/create
│   └── users/create/         # POST /api/users/create
│
├── domain/                   # ドメイン層
│   ├── entities/user/        # User エンティティ
│   ├── repositories/         # IUserRepository インターフェース
│   ├── usecases/user/        # CreateUserUseCase
│   ├── factories/User/       # User ファクトリー
│   └── valueObjects/         # Email, UserId 値オブジェクト
│
├── infrastructure/           # インフラストラクチャ層
│   └── auth0/                # Auth0 クライアント
│
├── middlewares/              # ミドルウェア
│   ├── auth0/                # Auth0 認証・メール検証
│   └── basicAuth/            # ベーシック認証
│
└── utils/                    # ユーティリティ
    ├── client/               # Hono クライアント生成
    └── config/               # 設定管理
```

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
  │              ├─→ UserFactory
  │              └─→ Value Objects (Email, UserId)
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

### ユースケース層 (`domain/usecases/`)

ビジネスロジックを実装。

```typescript
// CreateUserUseCase の責務
- Auth0ユーザーIDで既存ユーザーをチェック
- 既存の場合は既存ユーザーを返す（冪等性）
- 新規の場合は新しいユーザーを作成
```

### リポジトリ層 (`domain/repositories/`)

データアクセスの抽象化。

```typescript
interface IUserRepository {
  create(dto: CreateUserDto): Promise<User>;
  findByAuth0UserId(auth0UserId: string): Promise<User | null>;
}
```

### エンティティ層 (`domain/entities/`)

ビジネスルールを持つドメインオブジェクト。

```typescript
class User {
  id: string;
  auth0UserId: string;
  email: string;
  username: string;
  attributes: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

### 値オブジェクト層 (`domain/valueObjects/`)

不変でバリデーションを持つ値。

| 値オブジェクト | 責務 |
|---------------|------|
| `Email` | メールアドレス形式バリデーション（最大254文字） |
| `UserId` | フォーマット: `user_<timestamp>_<random9chars>` |

### ファクトリー層 (`domain/factories/`)

エンティティ生成の一元化。

```typescript
class UserFactory {
  static create(dto: CreateUserDto): User;      // 新規作成
  static reconstitute(data: UserData): User;    // 既存データから復元
}
```

### インフラストラクチャ層 (`infrastructure/`)

外部サービスとの連携。

- Auth0 クライアント設定
- （将来）データベース接続

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
2. **DDD**: エンティティ、値オブジェクト、ファクトリーの実装
3. **リポジトリパターン**: インターフェース経由のデータアクセス抽象化
4. **ユースケースパターン**: ビジネスロジックの分離
5. **ファクトリーパターン**: エンティティ生成の一元化

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET/POST | `/api/test` | ヘルスチェック |
| POST | `/api/user/create` | ユーザー作成 |
| POST | `/api/users/create` | ユーザー作成（重複） |

## TODO

- [ ] リポジトリ実装（データベースアクセス）
- [ ] API ハンドラーでユースケースの接続
- [ ] エンドポイント統一（`/user/create` と `/users/create` の整理）
