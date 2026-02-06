# beatbox-forge アーキテクチャ

## 概要

beatbox-forgeはクリーンアーキテクチャの原則に基づいて設計されています。ドメイン層がフレームワークに依存しない独立した構成となっており、テスタビリティと保守性を重視しています。

## ディレクトリ構造

```
apps/beatbox-forge/src/
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
│   ├── container/            # Composition Root（依存関係の組み立て）
│   ├── database/             # データベースクライアント
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

### リポジトリ層

リポジトリは**インターフェース（ドメイン層）**と**実装（インフラ層）**に分離される。

#### インターフェース (`domain/{object}/repositories/`)

```typescript
// ドメイン層：インターフェース定義
interface IUserRepository {
  create(params: CreateUserParams): Promise<User>;
  findByAuth0UserId(auth0UserId: string): Promise<User | null>;
}
```

#### 実装 (`infrastructure/repositories/{object}/`)

```typescript
// インフラ層：実装
export const createUserRepository = (db: Database): IUserRepository => ({
  async create(params) {
    const [result] = await db.insert(usersTable).values({...}).returning();
    return toEntity(result);  // DBレコード → Entity変換
  },
  async findByAuth0UserId(auth0UserId) {
    // ...
  },
});

// Entity変換関数
const toEntity = (record): User => {
  return createUser({
    auth0UserId: record.auth0UserId,
    email: record.email,
    username: record.username,
    attributes: record.attributes,
  });
};
```

#### 層間のアクセス方向

```
UseCase → Repository（インターフェース） → Entity
              ↑
        Repository（実装） → DB
```

| 層 | アクセス先 | 役割 |
|---|---|---|
| UseCase | Repository（抽象） | DBに直接アクセスしない |
| Repository実装 | Entity + DB | DBとEntityの橋渡し |
| Entity | Value Objects | ビジネスルールの適用 |

#### なぜ分離するか

1. **依存関係の逆転（DIP）**: インフラ層がドメイン層に依存する
2. **テスト容易性**: UseCaseテスト時にRepositoryをモック可能
3. **交換可能性**: DB変更時もドメイン層は影響なし

### ドメイン層の実装パターン

#### 設計思想: classを用いないOOP

本プロジェクトでは**classを使わずにオブジェクト指向の原則を実現**しています。

##### なぜclassを使わないのか

TypeScriptにおいてclassを使わない選択をした理由：

| 観点 | class | クロージャ + 関数 |
|------|-------|------------------|
| カプセル化 | privateキーワード（TypeScriptのみ） | クロージャで完全に隠蔽 |
| 不変性 | ミュータブルになりがち | イミュータブルを強制しやすい |
| テスト | モック/スパイが必要な場合あり | 純粋関数で直接テスト |
| Tree Shaking | 使わないメソッドも含まれる | 使う関数だけimport |
| 型推論 | インスタンス型の扱いが複雑 | 型推論が効きやすい |

##### クロージャによるカプセル化

classの`private`はTypeScriptのコンパイル時チェックのみで、ランタイムではアクセス可能です。一方、クロージャを使うことで**真のカプセル化**を実現できます。

**classの`private`はランタイムで無視される**

```typescript
class User {
  private password: string = "secret123";
}

const user = new User();
// TypeScript: エラー
// user.password;

// しかしランタイム（JavaScript）では...
console.log((user as any).password);  // "secret123" 見えてしまう
console.log(user["password"]);         // "secret123" これも見える
```

**クロージャは真のカプセル化**

```typescript
const createUser = (password: string) => {
  // この変数は外部から絶対にアクセスできない
  const _password = password;

  return {
    validatePassword: (input: string) => input === _password,
  };
};

const user = createUser("secret123");
// user._password → undefined（存在しない）
// user["_password"] → undefined
// Object.keys(user) → ["validatePassword"]のみ
```

##### 不変性（イミュータビリティ）

**classはミュータブルになりがち**

```typescript
class User {
  name: string;

  setName(name: string) {
    this.name = name;  // 内部状態を変更
  }
}

const user = new User();
user.name = "Alice";
user.name = "Bob";  // どこからでも変更可能 → バグの温床
```

**関数型はイミュータブルを強制しやすい**

```typescript
type User = {
  readonly name: string;
};

// 変更したい場合は新しいオブジェクトを返す
const updateName = (user: User, name: string): User => ({
  ...user,
  name,  // 新しい値で新オブジェクト作成
});

const user1 = { name: "Alice" };
const user2 = updateName(user1, "Bob");

console.log(user1.name);  // "Alice"（元のまま）
console.log(user2.name);  // "Bob"（新しいオブジェクト）
```

イミュータブルだと「いつ・どこで変更されたか」の追跡が容易で、バグが減ります。本プロジェクトでは`UserState`の全プロパティに`readonly`を付けて不変性を強制しています。

```typescript
// entities/index.ts
export type UserState = {
  readonly accountId: string;
  readonly sub: Sub;
  readonly email: Email;
  readonly name: Name;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};
```

##### Tree Shaking

Tree Shakingはバンドラー（webpack, esbuild等）が未使用コードを削除する最適化機能です。

**classの場合**

```typescript
// user.ts
export class User {
  getName() { return this.name; }
  getEmail() { return this.email; }
  getFullProfile() { /* 複雑な処理 */ }
  exportToPDF() { /* 重い処理 */ }
}

// 利用側
import { User } from "./user";
const user = new User();
user.getName(); // これしか使わない
```

→ `User`クラス全体がバンドルに含まれる（`exportToPDF`等の未使用メソッドも含む）

**関数型の場合**

```typescript
// user.ts
export const getName = (user: User) => user.name;
export const getEmail = (user: User) => user.email;
export const getFullProfile = (user: User) => { /* 複雑な処理 */ };
export const exportToPDF = (user: User) => { /* 重い処理 */ };

// 利用側
import { getName } from "./user"; // これだけimport
getName(user);
```

→ `getName`だけがバンドルに含まれる（他の関数は削除される）

**なぜclassは削除されにくいか**

バンドラーはclassのメソッドが動的に呼ばれる可能性（`user[methodName]()`等）を考慮し、安全のため全メソッドを残します。関数は独立しているため、import文から使用有無を静的に判断できます。

##### OOPの3原則との対応

| 原則 | classでの実現 | 本プロジェクトでの実現 |
|------|--------------|---------------------|
| カプセル化 | private/protected | クロージャによる隠蔽 |
| 継承 | extends | 関数の合成、スプレッド演算子 |
| 多態性 | interface/abstract class | TypeScriptの型（Union型、型の絞り込み） |

#### 構造と責務の分離

ドメイン層は**カプセル化**を実現するため、以下の3つに責務を分離しています。

```
domain/users/
├── entities/      ← 型（振る舞いの契約）+ 内部状態の型
├── behaviors/     ← 振る舞いの実装
├── factories/     ← Entityの生成
└── valueObjects/  ← 値オブジェクト
```

| ディレクトリ | 責務 | 内容 |
|-------------|------|------|
| entities | 「何であるか」を定義 | User型、UserState型 |
| behaviors | 「何ができるか」を実装 | 振る舞いの具体的な実装 |
| factories | 「どう作るか」を実装 | createUser、reconstructUser |

#### なぜbehaviorsを分離するのか

振る舞いをfactoriesに直接書くと、**振る舞いが増えるたびにファクトリが肥大化**します。

```typescript
// ❌ 問題: factoriesに振る舞いを直接書くと肥大化する
export const createUser = (params): User => {
  const state = { ... };
  return {
    getAccountId: () => state.accountId,
    getSub: () => state.sub,
    getEmail: () => state.email,
    getName: () => state.name,
    changeName: (newName) => { ... },
    changeEmail: (newEmail) => { ... },
    updateProfile: (profile) => { ... },
    // 振る舞いが増えるたびにここが肥大化...
  };
};
```

behaviorsを分離することで解決：

```typescript
// ✅ 解決: behaviorsに振る舞いを集約
// behaviors/index.ts
export const createUserBehaviors = (state: UserState): User => ({
  getAccountId: () => state.accountId,
  // ... 振る舞いの実装はここに集約
});

// factories/index.ts - シンプルに保てる
export const createUser = (params): User => {
  const state = { ... };
  return createUserBehaviors(state);  // 振る舞いを委譲
};
```

#### 分離のメリット

1. **単一責任の原則**: 各ファイルの責務が明確
2. **カプセル化**: 内部状態を隠蔽し、振る舞いのみ公開
3. **拡張性**: 振る舞いが増えてもファクトリが肥大化しない
4. **可読性**: 「型」「振る舞い」「生成」がどこにあるか明確

### エンティティ層 (`domain/{object}/entities/`)

Entityの**型（振る舞いの契約）**を定義。内部状態の型も定義するが、外部からはアクセスできない。

```typescript
import type { Sub } from "../valueObjects/sub";
import type { Email } from "../valueObjects/email";
import type { Name } from "../valueObjects/name";

// 内部状態の型（behaviors/factoriesで使用）
export type UserState = {
  readonly accountId: string;
  readonly sub: Sub;
  readonly email: Email;
  readonly name: Name;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

// 振る舞いの契約（外部に公開される型）
export type User = {
  toJSON: () => {
    accountId: string;
    sub: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
  // 必要に応じて追加
  // getName: () => Name;
  // changeName: (newName: string) => void;
};
```

### 振る舞い層 (`domain/{object}/behaviors/`)

Entityの**振る舞いを実装**。クロージャにより内部状態を隠蔽。

```typescript
import type { User, UserState } from "../entities";

export const createUserBehaviors = (state: UserState): User => ({
  toJSON: () => ({
    accountId: state.accountId,
    sub: state.sub.value,
    email: state.email.value,
    name: state.name.value,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
  }),
});
```

**ポイント**: `state`はクロージャに閉じ込められ、外部からアクセスできない。

### ファクトリ層 (`domain/{object}/factories/`)

Entityの**生成方法**を実装。用途に応じて複数のファクトリを用意。

```typescript
import { createSub } from "../valueObjects/sub";
import { createEmail } from "../valueObjects/email";
import { createName } from "../valueObjects/name";
import { createUserBehaviors } from "../behaviors";
import type { User } from "../entities";

// 新規作成用（UseCase層で使用）
export type CreateUserParams = {
  accountId: string;
  sub: string;
  email: string;
  name: string;
};

export const createUser = (params: CreateUserParams): User => {
  const state = {
    accountId: params.accountId,
    sub: createSub(params.sub),
    email: createEmail(params.email),
    name: createName(params.name),
    createdAt: new Date(),  // 自動生成
    updatedAt: new Date(),  // 自動生成
  };
  return createUserBehaviors(state);
};

// 復元用（Repository層で使用）
export type ReconstructUserParams = {
  accountId: string;
  sub: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export const reconstructUser = (params: ReconstructUserParams): User => {
  const state = {
    accountId: params.accountId,
    sub: createSub(params.sub),
    email: createEmail(params.email),
    name: createName(params.name),
    createdAt: params.createdAt,   // 引数から受け取る
    updatedAt: params.updatedAt,   // 引数から受け取る
  };
  return createUserBehaviors(state);
};
```

#### ファクトリの使い分け

| ファクトリ | 用途 | createdAt/updatedAt |
|-----------|------|---------------------|
| `createUser` | 新規作成（UseCase） | 自動生成 |
| `reconstructUser` | DB復元（Repository） | 引数から受け取る |

### カプセル化の確認

```typescript
const user = createUser({ ... });

// ✅ 振る舞いを通じてアクセス
user.toJSON();

// ❌ 内部プロパティに直接アクセス不可
user.accountId;  // エラー: プロパティが存在しない
user.state;      // エラー: プロパティが存在しない
```

### 処理の流れ

```
factories/createUser(params)
    │
    ├─ 1. 値オブジェクト作成（createSub, createEmail, createName）
    │
    ├─ 2. 内部状態（UserState）を組み立て
    │
    └─ 3. behaviors/createUserBehaviors(state) に渡す
                │
                └─ User型を返す（振る舞いのみ公開）
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

### クロージャベースドメインパターンでのテスト

新しいクロージャベースのパターンでは、内部状態はクロージャで隠蔽され、外部からは振る舞い（メソッド）のみアクセス可能。そのため、テストは**振る舞いを通じて検証**する。

```
User ドメインテスト
├── Factories テスト
│   ├── createUser: 新規作成の振る舞い検証
│   │   └── toJSON()で期待する出力が得られること
│   └── reconstructUser: DB復元の振る舞い検証
│       └── 指定したcreatedAt/updatedAtが保持されること
│
├── Behaviors テスト（必要に応じて）
│   └── 公開メソッドの動作検証（toJSON等）
│
└── Value Objects テスト
    ├── Sub: バリデーション詳細
    ├── Email: バリデーション詳細
    └── Name: バリデーション詳細
```

### テストアプローチの変更点

| 観点 | 旧パターン | クロージャパターン |
|------|-----------|------------------|
| 内部状態 | プロパティで直接アクセス | 振る舞いを通じて検証 |
| 値オブジェクト | spyで呼び出し確認 | 不要（振る舞いで検証） |
| カプセル化 | 弱い | 強い（クロージャで隠蔽） |

### Factoryのテスト例

```typescript
describe("createUser", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("有効なパラメータでUserを作成し、toJSONで正しい値を返す", () => {
    const user = createUser({
      accountId: "account-123",
      sub: "auth0|123",
      email: "test@example.com",
      name: "testuser",
    });

    expect(user.toJSON()).toStrictEqual({
      accountId: "account-123",
      sub: "auth0|123",
      email: "test@example.com",
      name: "testuser",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    });
  });

  it("無効なemailでエラーをスローする", () => {
    expect(() =>
      createUser({
        accountId: "account-123",
        sub: "auth0|123",
        email: "invalid-email",
        name: "testuser",
      })
    ).toThrow();
  });
});
```

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET/POST | `/api/test` | ヘルスチェック |
| POST | `/api/users/create` | ユーザー作成 |
