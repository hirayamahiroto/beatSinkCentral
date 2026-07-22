# api-server アーキテクチャ

## 概要

api-serverはクリーンアーキテクチャの原則に基づいて設計されています。ドメイン層がフレームワークに依存しない独立した構成となっており、テスタビリティと保守性を重視しています。

---

## なぜこの設計を採用するのか

クリーンアーキテクチャ + 純粋なDomain層 + DIという構成の目的は、突き詰めると**「変化への耐性」**に集約される。

### 1. ビジネスロジックの保護

Domain層がInfraの技術的詳細を知らないため、ORMの変更・DBの乗り換え・外部APIの差し替えがDomainに波及しない。ビジネスルールが汚染されず、長期的に腐りにくい。

### 2. 依存の方向が一方通行

DIで実装を外から注入することで、依存が常にDomainに向かう（Domainは誰にも依存しない）。

- Domainのテストが外部依存なしで書ける
- レイヤーごとにモックに差し替えやすい
- 「どこを変えたら何が壊れるか」が予測しやすい

### 3. 責務の単一化による変更コストの低減

各レイヤーがやることが明確なため、バグの発生場所が特定しやすく、機能追加時に触るべきファイルが絞られ、レビューの認知負荷が下がる。

### 4. ビジネスの言語とコードが一致する（ユビキタス言語）

これがDDD固有の強み。ドメインエキスパートと開発者が同じ言葉でモデルを議論でき、仕様変更がコードの変更に素直に対応する。

---

> **この設計が真価を発揮する条件**
>
> シンプルなCRUDには過剰だが、**ビジネスロジックが複雑・長期運用・チーム開発**という条件が揃うほど強みが際立つ。「ビジネスの複雑さと向き合う構造を持ちながら、技術的変化から守られている」ことが最大の目的である。

---

## ディレクトリ構造

```
apps/api-server/src/
├── app/api/[[...route]]/     # Hono ルーティング（プレゼンテーション層）
│   ├── route.ts              # メインルーター
│   ├── test/                 # GET/POST /api/test
│   └── users/create/         # POST /api/users/create
│
├── domain/                   # ドメイン層（オブジェクト単位のコンポジション構造）
│   ├── users/                # ユーザードメイン
│   │   ├── entities/         # User エンティティ
│   │   ├── behaviors/        # 振る舞いの実装
│   │   ├── factories/        # Entityの生成
│   │   ├── repositories/     # IUserRepository インターフェース
│   │   ├── policies/         # 不変条件の判定
│   │   └── valueObjects/     # 値オブジェクト
│   │       ├── Auth0UserId/
│   │       ├── Email/
│   │       └── Username/
│   └── services/             # Domain Service（複数集約をまたぐロジック）
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

---

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
│   Domain Service / Policy           │  ← ドメイン層
├─────────────────────────────────────┤
│   Entities & Value Objects          │  ← ドメイン層
├─────────────────────────────────────┤
│   Infrastructure (DB, Auth0)        │  ← インフラストラクチャ層
└─────────────────────────────────────┘
```

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

---

## レイヤー間のデータフロー

```
factories（Entityの生成方法を定義）
    ↑ 使用
Infrastructure（DBレコードをfactoriesでEntityに変換）
    ↓ Entityを返す
Usecase（EntityとRepository Interfaceだけを知っている）
    ↓ Entityの振る舞いで組み立てる
Presentation（結果を受け取るだけ）
```

| 層                         | やること                        | 知っていること           |
| -------------------------- | ------------------------------- | ------------------------ |
| Domain（Entity/factories） | 振る舞いと生成方法を定義        | 自分自身のみ             |
| Infrastructure             | DBレコード → factories → Entity | DomainとDB               |
| Usecase                    | Entityの振る舞いで組み立て      | DomainのみでDBを知らない |
| Presentation               | 結果を受け取って返す            | Usecaseのみ              |

### 重要な原則: UsecaseはEntityの振る舞いを使う

UsecaseではRepositoryから返されたEntityの**振る舞い（getter）**を通じてデータにアクセスする。Repositoryの生データに直接依存しない。

```typescript
// ❌ NG: Repositoryが生データを返し、Usecaseが直接参照する
const user = await userRepository.findBySub(sub); // { id: string; email: string }
return { userId: user.id, email: user.email };

// ✅ OK: RepositoryがEntityを返し、Usecaseは振る舞いで組み立てる
const user = await userRepository.findBySub(sub); // User Entity
return { userId: user.getId(), email: user.getEmail() };
```

---

## ドメイン層

ドメイン層はオブジェクト単位のコンポジション構造を採用しています。

```
# 従来の構造（レイヤー単位）
domain/{layer}/{object}/

# 現在の構造（オブジェクト単位）
domain/{object}/{layer}/
```

この構造により、関連するコードが近くに配置され、ドメインオブジェクトの凝集度が高まります。

### 設計思想: classを用いないOOP

TypeScriptにおいてclassを使わない選択をしています。

| 観点         | class                               | クロージャ + 関数            |
| ------------ | ----------------------------------- | ---------------------------- |
| カプセル化   | privateキーワード（TypeScriptのみ） | クロージャで完全に隠蔽       |
| 不変性       | ミュータブルになりがち              | イミュータブルを強制しやすい |
| テスト       | モック/スパイが必要な場合あり       | 純粋関数で直接テスト         |
| Tree Shaking | 使わないメソッドも含まれる          | 使う関数だけimport           |
| 型推論       | インスタンス型の扱いが複雑          | 型推論が効きやすい           |

#### classの`private`はランタイムで無視される

```typescript
class User {
  private password: string = "secret123";
}
const user = new User();
console.log((user as any).password); // "secret123" → 見えてしまう
```

#### クロージャは真のカプセル化

```typescript
const createUser = (password: string) => {
  const _password = password; // 外部から絶対にアクセスできない

  return {
    validatePassword: (input: string) => input === _password,
  };
};

const user = createUser("secret123");
// user._password → undefined（存在しない）
// Object.keys(user) → ["validatePassword"]のみ
```

#### OOPの3原則との対応

| 原則       | classでの実現            | 本プロジェクトでの実現                  |
| ---------- | ------------------------ | --------------------------------------- |
| カプセル化 | private/protected        | クロージャによる隠蔽                    |
| 継承       | extends                  | 関数の合成、スプレッド演算子            |
| 多態性     | interface/abstract class | TypeScriptの型（Union型、型の絞り込み） |

---

### ドメイン層のディレクトリ構造と責務分離

各ドメインオブジェクトは以下の4つに責務を分離しています。

```
domain/users/
├── entities/      ← 型（振る舞いの契約）+ 内部状態の型
├── behaviors/     ← 振る舞いの実装
├── factories/     ← Entityの生成
├── policies/      ← 外部状態に依存する不変条件の判定
└── valueObjects/  ← 値オブジェクト
```

| ディレクトリ | 責務                         | 内容                        |
| ------------ | ---------------------------- | --------------------------- |
| entities     | 「何であるか」を定義         | User型、UserState型         |
| behaviors    | 「何ができるか」を実装       | 振る舞いの具体的な実装      |
| factories    | 「どう作るか」を実装         | createUser、reconstructUser |
| policies     | 「不変条件を判定する」を実装 | assertNotRegistered 等      |
| valueObjects | 値の制約と正規化             | Email, Sub, Username 等     |

振る舞いをfactoriesに直接書くと、**振る舞いが増えるたびにファクトリが肥大化**します。

```typescript
// ❌ 問題: factoriesに振る舞いを直接書くと肥大化する
export const createUser = (params): User => {
  const state = { ... };
  return {
    getId: () => state.id,
    getEmail: () => state.email,
    changeName: (newName) => { ... },
    changeEmail: (newEmail) => { ... },
    // 振る舞いが増えるたびにここが肥大化...
  };
};

// ✅ 解決: behaviorsに振る舞いを集約
export const createUserBehaviors = (state: UserState): User => ({
  getId: () => state.id,
  // 振る舞いの実装はここに集約
});

export const createUser = (params): User => {
  const state = { ... };
  return createUserBehaviors(state); // 振る舞いを委譲
};
```

---

### 各サブ層の責務と実装パターン

#### Value Object

**概念**: ドメインの概念をプリミティブ型の代わりに型として表現し、生成時に値の正当性を保証し、不変性を持つオブジェクト。

EntityとVOの本質的な違いは**同一性**にある。

| 概念         | 同一性の根拠       | 例                                                            |
| ------------ | ------------------ | ------------------------------------------------------------- |
| Entity       | IDで識別される     | 同じ名前・メールでも、IDが違えば別のユーザー                  |
| Value Object | 値そのものが同一性 | 同じ値なら同じもの（`Email("a@b.com") === Email("a@b.com")`） |

**3つの責務**:

| 責務   | 説明                                   | 例                                         |
| ------ | -------------------------------------- | ------------------------------------------ |
| 検証   | 不正な値を生成時に拒否する             | 負のPrice、不正なEmail形式                 |
| 表現   | プリミティブ型にドメインの意味を与える | `string` → `Email`型、`number` → `Price`型 |
| 不変性 | 生成後に値が変わらないことを保証する   | setterを持たない、`readonly`で固定         |

```typescript
// ❌ プリミティブそのまま → 意味も検証もない
const price: number = -100; // 負の値が通ってしまう

// ✅ 値オブジェクトで表現
const price = createPrice(-100); // throw → 不正な値を拒否
const price = createPrice(500); // Price型 → 意味が明確、不変
```

VOはEntityの中だけで使われるものではなく、他のVOや集約の中でも使われる。使われる場所を問わず「その値が正当であること」を保証するのがVOの役割。

**責務の境界**: VOは**値それ自体で完結する検証**だけを行う。「入力された値だけで結論が出せるか？」が判断基準。Repositoryを参照する必要がある時点でVOではなくなる。

| 検証対象                     | VOの責務か | 例                                                          |
| ---------------------------- | ---------- | ----------------------------------------------------------- |
| 形式（正規表現、長さ、範囲） | ✅         | Email の形式、subId の最大長                                |
| 構造的不変条件               | ✅         | UUID として有効か、負数でないか                             |
| **一意性（DB上の重複）**     | ❌         | 「このメールは既に使われているか」→ Policy の仕事           |
| **他リソースとの関連**       | ❌         | 「この userId に紐づく Artist は存在するか」→ Policy の仕事 |
| **権限チェック**             | ❌         | 「この User は削除可能か」→ Policy / Usecase の仕事         |

**実装パターン**: interface + ファクトリ関数パターンを採用。

```typescript
// 型定義（readonlyで不変性を保証）
export interface Email {
  readonly value: string;
}

// ファクトリ関数（検証・正規化・生成を一括で担う）
export const createEmail = (value: string): Email => {
  const trimmed = value.trim(); // 表現（正規化）
  if (trimmed.length === 0) throw new Error("email is required"); // 検証
  if (trimmed.length > 254)
    throw new Error("email must be 254 characters or less");
  if (!EMAIL_REGEX.test(trimmed)) throw new Error("email format is invalid");
  return { value: trimmed }; // 不変オブジェクトを返す
};
```

VOが持ってよい振る舞い: 正規化（`normalize()`）、値ベースの判定（`period.overlapsWith(other)`）  
VOが持ってはいけない振る舞い: Repository/DB参照を伴う判定、外部サービス呼び出し

---

#### Entity（型・状態）

Entityの**型（振る舞いの契約）**を定義。内部状態の型も定義するが、外部からはアクセスできない。

```typescript
import type { Sub } from "../valueObjects/sub";
import type { Email } from "../valueObjects/email";

// 内部状態の型（behaviors/factoriesで使用）
export type UserState = {
  readonly id: string;
  readonly subId: Sub;
  readonly email: Email;
};

// 振る舞いの契約（外部に公開される型）
export type User = {
  getId: () => string;
  getSub: () => string;
  getEmail: () => string;
  toPersistence: () => {
    id: string;
    subId: string;
    email: string;
  };
};
```

---

#### Behaviors（振る舞い）

Entityの**振る舞いを実装**。クロージャにより内部状態を隠蔽。

```typescript
import type { User, UserState } from "../entities";

export const createUserBehaviors = (state: UserState): User => ({
  getId: () => state.id,
  getSub: () => state.subId.value,
  getEmail: () => state.email.value,
  toPersistence: () => ({
    id: state.id,
    subId: state.subId.value,
    email: state.email.value,
  }),
});
```

`state`はクロージャに閉じ込められ、外部からアクセスできない。`toPersistence()`は永続化用のプレーンデータに変換する振る舞い。

> **注意: getterとドメイン貧血症を混同しない**
>
> プロジェクト初期ではEntityの振る舞いがgetterと`toPersistence`のみになるが、これを「ドメイン貧血症」と判断してbehaviorsを削除してはならない。getterの役割は「ドメインロジックの実行」だけでなく「内部構造の隠蔽（カプセル化）」もある。後者は**プロジェクト初期から必要**。
>
> ```typescript
> // ❌ NG: behaviorsを削除してStateを直接返すとカプセル化が壊れる
> const user = await userRepository.findBySub(sub); // UserState
> return { email: user.email.value }; // Usecaseがvalue Objectの内部構造(.value)を知っている
>
> // ✅ OK: behaviorsを通じてプリミティブを返す
> const user = await userRepository.findBySub(sub); // User（振る舞い付き）
> return { email: user.getEmail() }; // Usecaseは内部構造を知らない
> ```

---

#### Factories（生成）

Entityの**生成方法**を実装。用途に応じて複数のファクトリを用意。

```typescript
import { createSub } from "../valueObjects/sub";
import { createEmail } from "../valueObjects/email";
import { createUserBehaviors } from "../behaviors";

// 新規作成用（UseCase層で使用）
export const createUser = (params: { subId: string; email: string }): User => {
  const state = {
    id: crypto.randomUUID(), // ドメインがIDを生成
    subId: createSub(params.subId),
    email: createEmail(params.email),
  };
  return createUserBehaviors(state);
};

// DB復元用（Repository層で使用）
export const reconstructUser = (params: {
  id: string;
  subId: string;
  email: string;
}): User => {
  const state = {
    id: params.id,
    subId: createSub(params.subId),
    email: createEmail(params.email),
  };
  return createUserBehaviors(state);
};
```

| ファクトリ        | 用途                 | ID                              |
| ----------------- | -------------------- | ------------------------------- |
| `createUser`      | 新規作成（UseCase）  | `crypto.randomUUID()`で自動生成 |
| `reconstructUser` | DB復元（Repository） | 引数から受け取る                |

**処理の流れ**:

```
factories/createUser(params)
    │
    ├─ 1. IDを生成（crypto.randomUUID）
    ├─ 2. 値オブジェクト作成（createSub, createEmail）
    ├─ 3. 内部状態（UserState）を組み立て
    └─ 4. behaviors/createUserBehaviors(state) に渡す
                │
                └─ User型を返す（振る舞いのみ公開）
```

**カプセル化の確認**:

```typescript
const user = createUser({ subId: "auth0|123", email: "test@example.com" });

user.getId(); // ✅ 振る舞いを通じてアクセス
user.getEmail(); // ✅
user.toPersistence(); // ✅

user.id; // ❌ エラー: プロパティが存在しない
user.state; // ❌ エラー: プロパティが存在しない
```

---

#### Policy（外部状態に依存する不変条件）

Entity / VO だけでは判定できない不変条件 — 典型的には**他のリソースの存在有無に依存するルール** — はPolicyとして切り出す。

```
domain/users/policies/
└── {policyName}/
    ├── index.ts         # 純粋関数として assert / check を実装
    └── index.test.ts
```

Policyが担う判定の例:

- 「この User はすでに登録されているか」
- 「この accountId はすでに使われているか」
- 「この集約は削除可能な状態か（子リソースが存在しないか）」

**重要**: Policy自身はRepositoryに直接触れない。呼び出し元（Usecase）が値をfetchしてPolicyに渡す形にすることで、Policyは純粋関数のままにできる。

**実装例**:

```typescript
// domain/users/policies/assertNotRegistered/index.ts
import type { User } from "../../entities";

export type UserAlreadyRegisteredError = Error & {
  readonly type: "UserAlreadyRegisteredError";
};

export const createUserAlreadyRegisteredError =
  (): UserAlreadyRegisteredError => {
    const error = new Error(
      "User already registered",
    ) as UserAlreadyRegisteredError;
    return Object.assign(error, {
      type: "UserAlreadyRegisteredError" as const,
    });
  };

export const isUserAlreadyRegisteredError = (
  error: unknown,
): error is UserAlreadyRegisteredError =>
  error instanceof Error &&
  (error as Partial<UserAlreadyRegisteredError>).type ===
    "UserAlreadyRegisteredError";

export const assertNotRegistered = (userIfRegistered: User | null): void => {
  if (userIfRegistered) throw createUserAlreadyRegisteredError();
};
```

ポイント:

- **純粋関数**: 入力（`User | null`）だけで結果が決まる
- **エラー型をco-locate**: ポリシー違反時に投げる型・factory・型ガードを同じファイルに置く
- **PIIを含めない**: メッセージに Auth0 sub 等の識別子を含めると、ログ経由で漏れる

**Policyのディレクトリは先回りでグルーピングしない**: Policyが増えて意味のある軸（registration / profile / security等）が見えた段階で初めてサブディレクトリに束ねる。

```
domain/users/policies/
├── assertNotRegistered/
├── assertProfilePublishable/     # 将来追加
└── canChangeEmail/               # 将来追加
```

---

#### Domain Service（集約をまたぐロジック）

単一のEntity/VOでは表現できない業務ルール（複数の集約にまたがる操作）はDomain Serviceとして純粋関数で表現する。

```
domain/
└── services/
    └── {serviceName}/
        └── index.ts     # 入力 → 複数のEntityを組み立てて返す純粋関数
```

**配置の条件**:

- 複数のEntity/VOを組み合わせる業務ルールである
- 状態を持たない（呼び出すたびに同じ結果）
- **副作用を持たない**（DB・外部APIに触れない）
- 入力として生の値を受け取り、出力としてEntity群を返す

**実装例**:

```typescript
// domain/services/userRegistration/index.ts
import { assertNotRegistered } from "../../users/policies/assertNotRegistered";

export const registerNewUser = (
  input: RegisterNewUserInput,
  userIfRegistered: User | null,
): RegisterNewUserResult => {
  // ポリシーで不変条件を判定（違反なら throw）
  assertNotRegistered(userIfRegistered);

  // 不変条件を通ったらEntityを組み立てる
  const user = createUser({ subId: input.subId, email: input.email });
  const artist = createArtist({
    accountId: input.accountId,
    ownerUserId: user.getId(),
  });
  return { user, artist };
};
```

このサービスはRepositoryを知らず、DBを知らず、トランザクションも知らない。

ポイント:

- **I/OはUsecase層に押し出す**: Domain ServiceはRepositoryを呼ばず、**すでに取得済みの値**を引数で受け取る
- **不変条件はpolicyに押し出す**: ルール判定はpolicyが担当し、Domain Serviceはpolicyを呼ぶだけ
- **組み立てはDomain Service自身が行う**: 複数Entityの関連付け（`ownerUserId = user.getId()`）はここに置く

**Domain ServiceとPolicyの使い分け**:

| 層             | 役割                                               |
| -------------- | -------------------------------------------------- |
| Policy         | **単一のルール判定**。違反時はthrow                |
| Domain Service | 複数Entityの組み立て。必要に応じてPolicyを呼び出す |

1つのルールだけならPolicyで完結させる。複数のルールや組み立てが絡む場合はDomain ServiceがPolicyを順番に呼び出す。

> **ブラックボックス化ではなく名前付け**
>
> Domain Serviceを入れることは「層を増やしてブラックボックス化する」ことではない。「純粋関数に業務ルールの**名前を付けた**」だけ。
>
> | ブラックボックス化（悪）                             | 名前付け（良）                 |
> | ---------------------------------------------------- | ------------------------------ |
> | 内部で副作用を持つ（DB呼び出し、グローバル状態変更） | 純粋関数で入力→出力だけ        |
> | 何が渡されて何が返るかが型から読めない               | 型シグネチャで全てが表現される |
> | 呼び出すと「何かが起きる」                           | 呼び出すと「値が返る」だけ     |

---

### ドメイン層の依存方向まとめ

```
Value Object           純粋。外部依存なし。
     ↑
Entity (State + type)  VOを内包。振る舞いの契約を定義。
     ↑
Behaviors              Stateをクロージャで閉じ込め、振る舞いを実装。
     ↑
Factories              VOとBehaviorsを組み合わせてEntityを生成。
     ↑
Policy                 取得済みEntityを受け取り、単一のルール判定を行う。
     ↑
Domain Service         Policyを呼び、複数のEntityを組み立てて返す。
```

全て**純粋関数**。副作用（DB・外部API）はこの層に入らない。

---

## 各層の責務

### プレゼンテーション層 (`app/api/`)

HTTPリクエスト/レスポンスの処理を担当。

- ルーティング定義
- リクエストバリデーション（Zod）
- レスポンス整形

### ミドルウェア層 (`middlewares/`)

横断的関心事を処理。

| ミドルウェア                | 責務                         |
| --------------------------- | ---------------------------- |
| `requireAuthMiddleware`     | Auth0 セッション検証         |
| `requireVerifiedMiddleware` | メールアドレス検証チェック   |
| `basicAuthMiddleware`       | ベーシック認証（オプション） |

### ユースケース層 (`usecases/`)

ビジネスロジックを実装。「集約を組み立てる → 永続化する」の2ステップに見える。ドメイン判定は一切書かず、fetch / call / save の配線だけを担当する。ドメインルールはDomain Service → Policyに押し込まれている。

```typescript
// usecases/users/createUser/index.ts
export const createUserUseCase = async (
  input: CreateUserInput,
  deps: CreateUserDeps,
): Promise<CreateUserOutput> => {
  // 1. 集約を組み立てる（既登録チェックはDomain Service内のpolicyが行う）
  const aggregate = await registerUser(input, deps.userRepository);

  // 2. トランザクション境界で永続化
  return persistUserAggregate(aggregate, deps);
};

const registerUser = async (
  input: CreateUserInput,
  userRepository: IUserRepository,
): Promise<RegisterNewUserResult> => {
  const userIfRegistered = await userRepository.findBySub(input.subId);
  return registerNewUser(input, userIfRegistered); // Domain Serviceに委譲
};

const persistUserAggregate = async (
  { user, artist }: RegisterNewUserResult,
  deps: CreateUserDeps,
): Promise<CreateUserOutput> =>
  deps.txRunner.run(async (tx) => {
    await deps.userRepository.save(user.toPersistence(), tx);
    await deps.artistRepository.save(artist.toPersistence(), tx);
    return { userId: user.getId(), artistId: artist.getArtistId() };
  });
```

**役割分担の明確化**:

| 層             | このフローで担当していること                                          |
| -------------- | --------------------------------------------------------------------- |
| Policy         | 「二重登録できない」という**単一の不変条件判定**                      |
| Domain Service | policy呼び出し + User / Artistの組み立て（関連付け含む）              |
| Usecase        | 既存UserのFetch、Domain Service呼び出し、トランザクション境界、永続化 |
| Repository     | 各Entityの個別永続化                                                  |

### リポジトリ層

リポジトリは**インターフェース（ドメイン層）**と**実装（インフラ層）**に分離されます。

#### インターフェース (`domain/{object}/repositories/`)

```typescript
export type UserSaveData = {
  id: string;
  subId: string;
  email: string;
};

export interface IUserRepository {
  save(data: UserSaveData): Promise<User>;
  findBySub(sub: string): Promise<User | null>;
}
```

#### 実装 (`infrastructure/repositories/{object}/`)

Repository実装は常に`reconstructUser`（factory）を使ってDBレコードをEntityに変換する。

```typescript
export const createUserRepository = (db: DatabaseClient): IUserRepository => ({
  async save(data: UserSaveData): Promise<User> {
    const [result] = await db.insert(usersTable).values(data).returning({ ... });
    return reconstructUser(result);
  },

  async findBySub(sub: string): Promise<User | null> {
    const results = await db.select(...).from(usersTable).where(eq(usersTable.subId, sub)).limit(1);
    if (results.length === 0) return null;
    return reconstructUser(results[0]);
  },
});
```

**なぜ分離するか**:

1. **依存関係の逆転（DIP）**: インフラ層がドメイン層に依存する
2. **テスト容易性**: UseCaseテスト時にRepositoryをモック可能
3. **交換可能性**: DB変更時もドメイン層は影響なし

### インフラストラクチャ層 (`infrastructure/`)

外部サービスとの連携。

- Auth0 クライアント設定
- リポジトリ実装（データベースアクセス）

---

## 設計原則: Functional Core, Imperative Shell

本プロジェクトの層構造は **Functional Core, Imperative Shell** パターンに一致する。

> **「データ」「変換」「副作用」を分離し、データはすべて値（Entity/VO）として扱う。**

| 区分                                 | 該当層                                    | 性質                     |
| ------------------------------------ | ----------------------------------------- | ------------------------ |
| **Functional Core（純粋な中核）**    | Entity / VO / Factory / Domain Service    | 副作用なし、値の変換だけ |
| **Imperative Shell（命令的な外殻）** | Usecase / Repository / エントリポイント層 | 副作用とI/Oを持つ        |

### Entityを明示的に取り回す設計

```typescript
const existing = await userRepository.findBySub(input.subId); // 入力
const user = createUser(input); // 合成
const saved = await userRepository.save(user.toPersistence()); // 永続化
return { userId: saved.getId() }; // 出力
```

「処理は引数と返り値だけで完結している」状態を保つことで、読む人が別ファイルを何個も開かずにUsecase1つで全体像を把握できる。

### 集約とトランザクション境界の分離

> **集約境界 ≠ トランザクション境界**

- **集約境界**: ドメインモデル上の不変条件の境界（Entity/VOの世界）
- **トランザクション境界**: 永続化の原子性の境界（Usecase/Repositoryの世界）

UserとArtistが別集約であっても、「新規登録時には原子的に作られなければならない」という業務要件があれば、Usecase層が両者にまたがるトランザクションを張ることは正当である。

### Atomic Designとの類似

| Atomic Design | バックエンドでの対応 | 責務                                               |
| ------------- | -------------------- | -------------------------------------------------- |
| Atom          | Entity / VO          | 最小単位のドメイン概念                             |
| Molecule      | Domain Service       | 原子を業務ルールで組み立てる                       |
| Template      | Usecase              | 副作用（永続化・トランザクション）を含む実行フロー |
| Page          | エントリポイント層   | 具体的なプロトコル（HTTP）への結合                 |

---

## Outside-In 設計

新しい Infrastructure を配置するときの思考の順序。

```
1. 「何が必要か」を業務上の要求として認識
       ↓
2. 「使う側（Usecase）が呼びたい形」を先に決める → Interface定義
       ↓
3. 「Usecaseではこう使う」を実装してみる
       ↓
4. ここで初めて「具体的にどう実装するか」を考える
```

**なぜこの順序が良いか**:

1. 抽象は「使う側にとって最小・最適な形」になる
2. 実装手段を後から変えられる（drizzle → Prisma への変更など）
3. 抽象がライブラリ固有の概念に汚染されない

**適用例**:

| 要求                         | インターフェース         | 実装                        |
| ---------------------------- | ------------------------ | --------------------------- |
| ユーザーを保存したい         | `IUserRepository.save`   | drizzle で INSERT           |
| トランザクションでまとめたい | `ITransactionRunner.run` | drizzle の `db.transaction` |
| メールを送りたい             | `IEmailSender.send`      | SendGrid / Resend / SES 等  |
| 画像を保存したい             | `IFileStorage.upload`    | S3 / GCS / ローカル等       |

---

## テスト方針

### 各層のテスト戦略

| 層               | テスト対象                       | モックの要否               |
| ---------------- | -------------------------------- | -------------------------- |
| Entity / VO      | ドメイン制約                     | 不要（純粋）               |
| Factory          | 生成ロジック                     | 不要（純粋）               |
| Domain Service   | 組み立てロジック                 | 不要（純粋関数）           |
| Policy           | 不変条件の判定                   | 不要（純粋関数）           |
| Usecase          | フロー・分岐・エラーハンドリング | Repository をモック        |
| Repository       | CRUDの実装                       | DBをモック                 |
| エントリポイント | プロトコル変換                   | Container/Usecase をモック |

純粋な中核は副作用がないのでモック不要、外殻だけモックが必要、という構図になる。

### クロージャベースドメインパターンでのテスト

内部状態はクロージャで隠蔽されるため、テストは**振る舞いを通じて検証**する。

```typescript
describe("createUser", () => {
  it("有効なパラメータでUserを作成し、振る舞いで正しい値を返す", () => {
    const user = createUser({
      subId: "auth0|123456789",
      email: "test@example.com",
    });

    expect(user.getId()).toBeTruthy();
    expect(user.getSub()).toBe("auth0|123456789");
    expect(user.getEmail()).toBe("test@example.com");
  });

  it("toPersistenceで永続化用データを返す", () => {
    const user = createUser({
      subId: "auth0|123456789",
      email: "test@example.com",
    });
    const data = user.toPersistence();

    expect(data.id).toBeTruthy();
    expect(data.subId).toBe("auth0|123456789");
    expect(data.email).toBe("test@example.com");
  });

  it("無効なemailでエラーをスローする", () => {
    expect(() =>
      createUser({ subId: "auth0|123456789", email: "invalid-email" }),
    ).toThrow();
  });
});

describe("reconstructUser", () => {
  it("指定したid/subId/emailがgetterで取得できること", () => {
    const user = reconstructUser({
      id: "user-123",
      subId: "auth0|123456789",
      email: "test@example.com",
    });

    expect(user.getId()).toBe("user-123");
    expect(user.getSub()).toBe("auth0|123456789");
    expect(user.getEmail()).toBe("test@example.com");
  });
});
```

---

## 使用技術

| カテゴリ       | 技術                             |
| -------------- | -------------------------------- |
| フレームワーク | Next.js 15 (App Router) + Hono 4 |
| 認証           | @auth0/nextjs-auth0              |
| バリデーション | Zod + @hono/zod-validator        |
| テスト         | Vitest                           |
| 言語           | TypeScript 5                     |

---

## API エンドポイント

| メソッド | パス                | 説明           |
| -------- | ------------------- | -------------- |
| GET/POST | `/api/test`         | ヘルスチェック |
| POST     | `/api/users/create` | ユーザー作成   |
