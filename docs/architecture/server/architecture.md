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
│   ├── route.ts              # basePath + 全体ミドルウェア + onError + トップ mount
│   ├── test/                 # /api/test
│   ├── users/                # /api/users
│   ├── artists/              # /api/artists
│   ├── link-types/           # /api/link-types
│   ├── validators/           # リクエストバリデータ
│   └── errors/               # プレゼンテーション層のエラー型
│
├── domain/                   # ドメイン層（オブジェクト単位のコンポジション構造）
│   ├── users/                # ユーザードメイン
│   │   ├── entities/         # User エンティティ
│   │   ├── behaviors/        # 振る舞いの実装
│   │   ├── factories/        # Entityの生成
│   │   ├── repositories/     # IUserReader / IUserWriter インターフェース
│   │   ├── errors/           # ドメインエラーの型 + factory + 型ガード
│   │   ├── policies/         # 不変条件の判定
│   │   └── valueObjects/     # 値オブジェクト
│   │       ├── Auth0UserId/
│   │       ├── Email/
│   │       └── Username/
│   └── services/             # Domain Service（複数集約をまたぐロジック）
│
├── usecases/                 # ユースケース層（アプリケーション層）
│   ├── capabilities/         # 権能型の定義（用途ごと）
│   ├── authorization/        # 経路ごとの入り口（1 経路 = 1 モジュール）
│   │   ├── resolution/       # toActor / toUser（畳み込み）
│   │   ├── conflict/         # 一意制約違反を err に戻す
│   │   ├── identity/         # withIdentityCapabilities
│   │   ├── artistRead/       # withArtistReadCapabilitiesById
│   │   ├── userWrite/        # withUserWriteCapabilitiesById
│   │   ├── artistWrite/      # withArtistWriteCapabilitiesById
│   │   ├── artistStorageWrite/ # withArtistStorageWriteCapabilitiesById
│   │   └── registration/     # withRegistrationCapabilities
│   ├── users/                # createUser / getMe / updateMyEmail ...
│   ├── artistProfiles/       # プロフィールの取得・保存・公開
│   └── linkTypes/            # リンク種別マスタの参照
│
├── errorMap/                 # AppError → HTTP / ログへの変換
│
├── infrastructure/           # インフラストラクチャ層
│   ├── auth0/                # Auth0 クライアント
│   ├── capabilities/         # 権能の合成（Composition Root）
│   │   ├── index.ts          # getCapabilityDeps（各部品の合成のみ）
│   │   ├── builders/         # executor → 権能（用途ごとの build*Capabilities）
│   │   └── resolveActorState/ # subId → ActorResolution
│   ├── database/             # データベースクライアント
│   ├── transaction/          # Executor 型とトランザクション境界（runInTransaction）
│   └── repositories/         # リポジトリ実装（Reader / Writer）
│
├── middlewares/              # ミドルウェア
│   ├── auth0/                # Auth0 認証・メール検証
│   └── requestContext/       # リクエスト相関 ID の確定
│
└── utils/                    # ユーティリティ
    ├── client/               # Hono クライアント生成
    ├── config/               # 設定管理
    ├── errors/               # 型付きエラーの生成
    ├── logger/               # ログ出力先の抽象
    ├── requestContext/       # リクエストスコープの相関情報保持
    └── result/               # Result<T, E>（失敗を返り値で表す）
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
  ├─→ Middlewares (Auth0)
  ├─→ Authorization (権能の組み立て・Actor 解決・トランザクション境界)
  │    └─→ Usecase (createUser 等)
  │         └─→ IUserReader / IUserWriter (interface)
  │              └─→ User Entity
  │                   └─→ Value Objects (Sub, Email, Name)
  └─→ Infrastructure (Auth0 client, capabilities)
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

各ドメインオブジェクトは以下に責務を分離しています。

```
domain/users/
├── entities/      ← 型（振る舞いの契約）+ 内部状態の型
├── behaviors/     ← 振る舞いの実装
├── factories/     ← Entityの生成
├── errors/        ← ドメインエラーの型 + factory + 型ガード
├── policies/      ← 外部状態に依存する不変条件の判定
└── valueObjects/  ← 値オブジェクト
```

| ディレクトリ | 責務                         | 内容                        |
| ------------ | ---------------------------- | --------------------------- |
| entities     | 「何であるか」を定義         | User型、UserState型         |
| behaviors    | 「何ができるか」を実装       | 振る舞いの具体的な実装      |
| factories    | 「どう作るか」を実装         | createUser、reconstructUser |
| errors       | 「何が破られたか」を定義     | UserNotFoundError 等        |
| policies     | 「不変条件を判定する」を実装 | ensurePublishable 等        |
| valueObjects | 値の制約と正規化             | Email, Sub, Username 等     |

`errors/` と `policies/` は分ける。エラー型は「何が破られたか」の語彙であり判定ロジックを持たない。判定に業務知識が必要なもの（公開可否の最小核など）だけを `policies/` に置き、単なる存在チェックはルールを知っている呼び出し元が行う。詳細は [error-handling/layer-responsibilities.md](./error-handling/layer-responsibilities.md) を参照。

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

**公開する振る舞いは、その時点で本番コードに呼び手があるものに限る。** getter を置くこと自体は上記の通り必要だが、全フィールドに先回りして getter を並べることは求めていない。書き込み専用の集約は `toPersistence` から始め、Reader や usecase が値を読む要件が出た時点でその getter を足す。既存の集約を構造の参考にしてよいが、その公開面（getter・`export`・スキーマ・index）を一式写さない。テストからしか呼ばれない公開 API は、意図が読めなくなるため置かない。

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

#### Error（ドメインエラーの語彙）

「何のルールが破られたか」を表す型を `errors/{errorName}/` に置く。**判定ロジックは持たない**。

```
domain/users/errors/
└── {errorName}/
    ├── index.ts         # type + factory + 型ガード
    └── index.test.ts
```

**実装例**:

```typescript
// domain/users/errors/userAlreadyRegistered/index.ts
import { createTypedError } from "../../../../utils/errors/createTypedError";

export type UserAlreadyRegisteredError = Error & {
  readonly type: "UserAlreadyRegisteredError";
};

export const createUserAlreadyRegisteredError =
  (): UserAlreadyRegisteredError =>
    createTypedError("UserAlreadyRegisteredError");

export const isUserAlreadyRegisteredError = (
  error: unknown,
): error is UserAlreadyRegisteredError =>
  error instanceof Error &&
  (error as Partial<UserAlreadyRegisteredError>).type ===
    "UserAlreadyRegisteredError";
```

ポイント:

- **投げない**: エラーは `Result` の `err` に載せる値。`throw` する `assertXxx` は置かない
- **HTTPを知らない**: status コードもクライアント向け文言もここには書かない
- **PIIを含めない**: メッセージに Auth0 sub 等の識別子を含めると、ログ経由で漏れる

#### Policy（外部状態に依存する不変条件）

Entity / VO だけでは判定できない不変条件のうち、**判定そのものに業務知識があるもの**をPolicyとして切り出す。

```
domain/artistProfiles/policies/
└── {ruleName}/
    ├── index.ts         # ルールの定義 + ensureXxx(): Result<void, E>
    └── index.test.ts
```

Policyが担う判定の例:

- 「このプロフィールは公開できる状態か（公開に必要な最小核は何か）」
- 「この集約は削除可能な状態か（子リソースが存在しないか）」

**単なる存在チェックにPolicyを作らない**: 「User が存在するか」「handle が既に使われているか」は判定に業務知識がない。ルールを知っている呼び出し元が `if (!user) return err(createUserNotFoundError())` と書けば足り、間に関数を挟むと呼び出し箇所から条件が見えなくなる。

**重要**: Policy自身はRepositoryに直接触れない。呼び出し元（Usecase）が値をfetchしてPolicyに渡す形にすることで、Policyは純粋関数のままにできる。

**実装例**:

```typescript
// domain/artistProfiles/policies/publishability/index.ts
export const collectMissingPublishFields = (
  profile: ArtistProfile,
): PublishRequiredField[] => {
  const missing: PublishRequiredField[] = [];
  if (!profile.getName()) missing.push("name");
  if (!profile.getImageUrl()) missing.push("imageUrl");
  // ...
  return missing;
};

export const ensurePublishable = (
  profile: ArtistProfile,
): Result<void, ProfileNotPublishableError> => {
  const missingFields = collectMissingPublishFields(profile);
  if (missingFields.length > 0) {
    return err(createProfileNotPublishableError(missingFields));
  }
  return ok(undefined);
};
```

ポイント:

- **純粋関数**: 入力だけで結果が決まる
- **`Result` を返す**: `ensureXxx` は `Result<void, E>`。`throw` しない
- **ルール本体を持つ**: 「公開に必要な最小核」のような業務知識がここに一元化される

**Policyのディレクトリは先回りでグルーピングしない**: Policyが増えて意味のある軸（registration / profile / security等）が見えた段階で初めてサブディレクトリに束ねる。

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
- 状態を持たない（インスタンス変数・モジュールスコープの可変状態を持たない）
- **I/O を持たない**（DB・外部API・時刻取得に触れない）
- 入力として生の値を受け取り、出力として `Result<Entity群, E>` を返す

**ここでいう「純粋」は I/O を持たないことを指し、完全な決定性までは要求しない**。`create{Entity}` は内部で `crypto.randomUUID()` により ID を採番するため、同じ入力でも生成される ID は毎回異なる。ID は Entity の同一性そのもので、外部から渡すと呼び出し側が採番責務を負ってしまうため、生成器を注入せず Entity ファクトリに閉じている。テストで ID を固定したい場合は `crypto.randomUUID` をスタブする。

**実装例**:

```typescript
// domain/services/userRegistration/index.ts
export const registerNewUser = (
  input: RegisterNewUserInput,
  userIfRegistered: User | null,
  artistIfHandleTaken: Artist | null,
): Result<RegisterNewUserResult, RegisterNewUserError> => {
  if (userIfRegistered) return err(createUserAlreadyRegisteredError());
  if (artistIfHandleTaken) {
    return err(createHandleAlreadyTakenError(artistIfHandleTaken.getHandle()));
  }

  const user = createUser({ subId: input.subId, email: input.email });
  if (!user.ok) return user;

  return map(
    createArtist({
      handle: input.handle,
      ownerUserId: user.value.getId(),
    }),
    (artist) => ({ user: user.value, artist }),
  );
};
```

このサービスはRepositoryを知らず、DBを知らず、トランザクションも知らない。

ポイント:

- **I/OはUsecase層に押し出す**: Domain ServiceはRepositoryを呼ばず、**すでに取得済みの値**を引数で受け取る
- **失敗は `err` で返す**: エラー union（`RegisterNewUserError`）に、自身が判定する違反と VO 由来の違反の両方が現れる
- **組み立てはDomain Service自身が行う**: 複数Entityの関連付け（`ownerUserId = user.getId()`）はここに置く

**Domain ServiceとPolicyの使い分け**:

| 層             | 役割                                                                 |
| -------------- | -------------------------------------------------------------------- |
| Policy         | **単一のルール判定**。`ensureXxx` が `Result<void, E>` を返す        |
| Domain Service | 複数Entityの組み立て。必要に応じてPolicyを呼び出し、`err` を伝播する |

1つのルールだけならPolicyで完結させる。複数のルールや組み立てが絡む場合はDomain ServiceがPolicyを順番に呼び出し、最初の `err` をそのまま返す。

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

#### ルーティングは階層ごとに合成する

ディレクトリを切るのは **リソースの境目** と **ミドルウェアが変わる境目** だけ。URL セグメントの数だけディレクトリを掘らない。境界の `index.ts` が「path → ユニット」の対応表（マウントテーブル）を `.route()` で宣言し、ユニットは境界の直下に**意図を表す名前**のディレクトリ（`index.ts` + `index.test.ts`）としてフラットに並べる。各ユニットは自分の相対パスと自分のバリデーションを持つ小さな Hono app（型推論の都合上、バリデーションは境界側に持ち出さない）。

```text
app/api/[[...route]]/
├── route.ts                    # basePath + 全体ミドルウェア + onError + トップ mount のみ
├── artists/
│   ├── index.ts                # 公開 / 認証済みの2区画を合成するだけ（ミドルウェアなし）
│   ├── public/                 # 公開（認証なし・可変ハンドル handle）
│   │   ├── index.ts            # マウントテーブル
│   │   ├── listArtists/        # GET /artists
│   │   └── getArtist/          # GET /artists/:handle
│   └── [artistId]/             # ← ここが認証境界（不変 ID artistId。handle とは別の鍵）
│       ├── index.ts            # requireAuthMiddleware + マウントテーブル
│       ├── updateHandle/       # POST /:artistId
│       ├── getProfile/         # GET  /:artistId/profile
│       ├── updateAttributes/   # POST /:artistId/attributes
│       ├── writeStoryChapter/  # POST /:artistId/story/chapters/:chapterKey
│       ├── replaceLinks/       # POST /:artistId/links
│       ├── uploadProfileImage/ # POST /:artistId/profile/image
│       └── publishProfile/     # POST /:artistId/profile/publish
└── link-types/
    ├── index.ts                # 認証不要 → 集約のみ
    └── get/                    # GET /link-types
```

公開（認証なし・可変ハンドル `handle`）と認証済み（不変 ID `artistId`）は同じ artist を指すが鍵も認可も別物なので、`artists/public/` と `artists/[artistId]/` に分けて並べる。こうしておくと、`artists/index.ts` の2行（`public` / `[artistId]`）がそのまま「公開・認証」の2区画になり、境界の `index.ts` を見れば全体像が分かる。将来公開ルートの名前空間を分離する場合も、`artists/public/` をディレクトリごと移してマウント先を変えるだけで済む。

階層 `index.ts` の責務は 2 つだけに限定する。

1. 配下ユニットの合成（マウントテーブルとして path → ユニット を `.route()` で宣言）
2. その階層に効くミドルウェアの適用

ユニット（リーフ）は **1 ディレクトリ = 1 エンドポイント**を維持する。ディレクトリ名はアクションの意図を表す名前にする。HTTP メソッド名のディレクトリ（`get/` `post/`）や method を埋め込んだファイル名（`profile.publish.post.ts` 等）は使わない。動的セグメントは `[handle]/` と表記する（`[[...route]]` 配下は Next.js のルート探索対象外なので、ルーティング解釈と衝突しない）。

**認証はミドルウェアが変わる境界の `index.ts` で適用する。** トップでパス文字列を列挙しない。境界側で `.use("*", requireAuthMiddleware)` を一度書けば配下は構造的に保護されるため、リソース追加時の付け忘れが起きにくい（デフォルトが deny 側に倒れる）。境界はリソースの先頭に限らない。`artists/` は公開/認証が混在するため無防備なままで、認証境界は1階層下の `[artistId]/` にある。

> **注意（`.use("*")` と同形の公開ルートが重なる場合はマウント順で解決する）**: `.use("*", mw)` は「ALL メソッド」に一致するため、境界の**裸のパス**（例: `/artists/:artistId`・POST・認証必須）と別リソースの公開ルート（例: `/artists/:handle`・GET・公開）が同じ「1セグメントの動的パス」形状を共有しうる。ただし Hono はマッチした handler / middleware を**登録順に合成し、先に応答したハンドラで打ち切る**ため、親ルーターで**公開ルートを境界より先にマウントしていれば**、公開 GET は先に登録された公開ハンドラが応答し、境界の `use("*")` には到達しない。公開側に存在しないメソッド（POST 等）だけが境界に流れて認証される。したがって境界は素直に `.use("*", requireAuthMiddleware)` で全面適用してよい。
>
> 成立条件は「公開ルートを先にマウントする」の1点のみ（`artists/index.ts` の順序制約コメント参照）。逆順にすると TrieRouter フォールバック時に公開 GET が 401 になる（RegExpRouter は逆順でも公開側を優先するが、順序に依存しないことを保証する仕様ではない）。この順序は合成テストの「公開ルートは認証を要求しない」アサーションで担保する。
>
> **既知の制約（Hono ルーターのフォールバック）**: 同じ親パス配下に「リテラル segment + ワイルドカード」（例: `/artists/me/*`）と「動的パラメータ」（例: `/artists/:handle`）が共存すると、Hono の `RegExpRouter` が `UnsupportedPathError` を投げ、`SmartRouter` が警告なしに `TrieRouter`（低速だが動作は正しい）へフォールバックする。`.route()` は子ルートを親の router へ完全にマージするため、この事象はアプリ全体の router に影響する。本プロジェクトではかつて `artists/me/*` と `:handle` の組み合わせで発生していたが、`me` 系ルートの削除（contract 完了）により解消し、現在は `RegExpRouter` で動作している。リテラル segment + ワイルドカードを動的パラメータと同じ親配下に足すと再発するため、追加時は認識しておくこと。

`AppType`（Hono RPC）の型推論を保つため、各 `index.ts` は `.route()` または `.get()`/`.post()` のメソッドチェーンを維持する。

> **既存の例外**: `users/`, `link-types/` は旧規約（HTTP メソッド名ディレクトリ）のまま。新規実装・変更時にこの規約へ順次移行する。

### ミドルウェア層 (`middlewares/`)

横断的関心事を処理。

| ミドルウェア                | 責務                                           |
| --------------------------- | ---------------------------------------------- |
| `requestContextMiddleware`  | リクエスト相関 ID（requestId / traceId）の確定 |
| `requireAuthMiddleware`     | Auth0 セッション検証                           |
| `requireVerifiedMiddleware` | メールアドレス検証チェック                     |

`requestContextMiddleware` は認証より前に置く。認証失敗（401）のログにも相関情報を載せるため。

### ユースケース層 (`usecases/`)

ビジネスロジックを実装。「集約を組み立てる → 永続化する」の2ステップに見える。ドメイン判定は一切書かず、fetch / call / save の配線だけを担当する。ドメインルールはDomain Service → Policyに押し込まれている。

usecase は**権能（capabilities）を第1引数で受け取る**。トランザクション境界と Actor の解決は権能を組み立てる側（`usecases/authorization`）が持ち、usecase は渡された権能だけを使う。詳細は「認可と権能（capabilities）」を参照。

```typescript
// usecases/users/createUser/index.ts
type CreateUserCaps = Pick<RegistrationCapabilities, "users" | "artists">;

export const createUser = async (
  caps: CreateUserCaps,
  input: CreateUserInput,
): Promise<Result<CreateUserOutput, CreateUserError>> => {
  const [userIfRegistered, artistIfHandleTaken] = await Promise.all([
    caps.users.findBySub(input.subId),
    caps.artists.findByHandle(input.handle),
  ]);

  const registered = registerNewUser(
    input,
    userIfRegistered,
    artistIfHandleTaken,
  );
  if (!registered.ok) return registered;

  const { user, artist } = registered.value;
  await caps.users.save(user.toPersistence());
  await caps.artists.save(artist.toPersistence());

  return ok({ userId: user.getId(), artistId: artist.getArtistId() });
};
```

**役割分担の明確化**:

| 層             | このフローで担当していること                               |
| -------------- | ---------------------------------------------------------- |
| Policy         | 「二重登録できない」という**単一の不変条件判定**           |
| Domain Service | policy呼び出し + User / Artistの組み立て（関連付け含む）   |
| 権能の組み立て | Actor の解決、トランザクション境界、権能へのリポジトリ束ね |
| Usecase        | 既存UserのFetch、Domain Service呼び出し、永続化の呼び出し  |
| Repository     | 各Entityの個別永続化                                       |

### リポジトリ層

リポジトリは**インターフェース（ドメイン層）**と**実装（インフラ層）**に分離されます。

#### インターフェース (`domain/{object}/repositories/`)

インターフェースは**読み取り（Reader）と書き込み（Writer）に分割**する。読み取りだけの usecase に書き込み手段を渡さないため。

```typescript
export interface IUserReader {
  findBySub(sub: string): Promise<User | null>;
}

export interface IUserWriter {
  save(data: UserSaveData): Promise<User>;
  updateEmail(data: UserUpdateEmailData): Promise<User>;
}
```

メソッドに `tx?: TransactionContext` 引数は置かない。**executor（db / トランザクション）は生成時に注入する**。トランザクション内で動くかどうかは権能を組み立てる側の決定であり、usecase が引数で渡す情報ではない。

`tx?` を引数で受ける旧方式を廃止したのは、渡し忘れが静かに db 直参照になるため。`save(data, tx)` の `tx` を書き忘れてもコンパイルは通り、テストも通り、本番で「トランザクション外の書き込み」だけが残る。権能の生成時にバインドしてしまえば、渡し忘れという操作自体が存在しない。

#### 実装 (`infrastructure/repositories/{object}/`)

Repository実装は常に`reconstructUser`（factory）を使ってDBレコードをEntityに変換する。

```typescript
type Executor = DatabaseClient | TransactionContext;

export const createUserReader = (executor: Executor): IUserReader => ({
  async findBySub(sub: string): Promise<User | null> {
    const results = await executor
      .select(userColumns)
      .from(usersTable)
      .where(eq(usersTable.subId, sub))
      .limit(1);
    if (results.length === 0) return null;
    return reconstructUser(results[0]);
  },
});

export const createUserWriter = (executor: Executor): IUserWriter => ({
  async save(data: UserSaveData): Promise<User> {
    const [result] = await executor
      .insert(usersTable)
      .values(data)
      .returning(userColumns);
    return reconstructUser(result);
  },
  // ...
});
```

**なぜ分離するか**:

1. **依存関係の逆転（DIP）**: インフラ層がドメイン層に依存する
2. **テスト容易性**: UseCaseテスト時にRepositoryをモック可能
3. **交換可能性**: DB変更時もドメイン層は影響なし
4. **権能の最小化**: 読み取りしかしない usecase に Writer が渡らない

### インフラストラクチャ層 (`infrastructure/`)

外部サービスとの連携。

- Auth0 クライアント設定
- リポジトリ実装（データベースアクセス）
- 権能（capabilities）の組み立てとトランザクション境界

---

## 認可と権能（capabilities）

usecase にリポジトリ一式と `subId` を渡す形は取らない。**「誰として、何ができるか」を型で束ねた権能（capabilities）を渡す**。Actor の解決・認可・トランザクション境界は usecase の外側で完結させ、usecase は受け取った権能だけを使う。

### なぜ権能で渡すか

| 課題（リポジトリ一式を渡す場合）                               | 権能モデルでの解決                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------- |
| 読み取り専用の usecase からも `save` / `upsert` が呼べてしまう | Writer を型として届かせない（呼ぼうとするとコンパイルエラー） |
| 認可（誰の操作か）の解決が usecase ごとに散らばる              | `subId → Actor` の解決を経路モジュールに集約する              |
| トランザクション境界の張り忘れ・`tx` の渡し忘れが静かに通る    | 境界を usecase の外に出し、渡し忘れ自体を発生させない         |

「渡していないものは呼べない」をコンパイラに強制させることが目的である。

### 層構造

| モジュール                    | 責務                                        | 知っていること      |
| ----------------------------- | ------------------------------------------- | ------------------- |
| `usecases/capabilities`       | 権能型の定義（用途ごと）                    | Domain のみ         |
| `usecases/authorization`      | 経路ごとの入り口（Actor 解決 + 境界の適用） | `capabilities` のみ |
| `infrastructure/capabilities` | 権能の組み立てと `CapabilityDeps` の合成    | DB・リポジトリ実装  |

`usecases/capabilities` は型定義だけを持ち、DB を知らない。実体の組み立ては `infrastructure/capabilities` が担う（依存は常に内向き）。

### 型の軸は用途、中身は集約ごとの Reader / Writer

権能型は**用途（どの経路で呼ばれるか）ごとに 1 つ**定義する。中身は集約ごとの Reader / Writer を必要な分だけ持つ。

| 権能型                           | 主体                 | 境界                    | 用途                                                        |
| -------------------------------- | -------------------- | ----------------------- | ----------------------------------------------------------- |
| `PublicReadCapabilities`         | 不要                 | なし                    | 未認証で読める公開データ                                    |
| `IdentityCapabilities`           | 解決結果             | なし                    | 自分の登録状態そのものを返す                                |
| `ArtistReadCapabilities`         | Actor（User+Artist） | なし                    | Artist を伴うデータの読み取り                               |
| `UserWriteCapabilities`          | User                 | トランザクション        | User スコープで完結する更新（例: email）                    |
| `ArtistWriteCapabilities`        | Actor（User+Artist） | トランザクション        | Artist を伴うデータの更新                                   |
| `RegistrationCapabilities`       | 不在                 | トランザクション        | 登録（主体が原理的に存在しない書き込み）                    |
| `ArtistStorageWriteCapabilities` | Actor（User+Artist） | なし（DB 外の外部 I/O） | Artist を伴うストレージへの書き込み（例: プロフィール画像） |

DB トランザクションを張らない権能（`ArtistStorageWriteCapabilities`）は、Storage への PUT のような**外部 I/O をトランザクション境界に入れない**ための分離でもある。ストレージ書き込みと DB 更新（URL の保存）は別リクエストに分かれ、原子性は求めない。

**主体のスコープは機能の要件で決める**。Artist の有無に依存しない機能は `UserWriteCapabilities` を使い、Artist 未作成（`userOnly`）を弾かない。「認証済みなら Actor が揃っている」という前提を全経路に敷かない。

型名・ヘルパ名・モジュール名には**主体のスコープを含める**（`UserWrite` / `ArtistWrite` / `ArtistRead`）。`Write` だけでは「何が揃っていれば通るのか」が名前から読めず、Artist 未作成のユーザーを弾く経路に誤って載せてしまう。

集約が増えたときは、対応する用途の権能型にその集約の Reader / Writer を足す。**usecase 側は `Pick` で自分が使う権能だけに絞る**。これにより「渡しすぎ」がシグネチャに現れる。

```typescript
type SaveMyProfileCaps = Pick<
  ArtistWriteCapabilities,
  "actor" | "artistProfiles"
>;
type UpdateMyEmailCaps = Pick<UserWriteCapabilities, "user" | "users">;
type ListLinkTypesCaps = Pick<PublicReadCapabilities, "linkTypes">;
```

`defineUsecase` / `Exact` のような「余分な権能をコンパイルエラーにする」仕掛けは**採用しない**。`Pick` と明示的な `Caps` 型で意図は読み取れるため、型ユーティリティの追加コストに見合わない。

### Actor の解決は状態ユニオンで表す

`resolveActorState` は Actor 解決の結果を**状態ユニオン**で返す。「失敗」に畳むかどうかは呼ぶ側の用途が決める。

```typescript
export type ActorResolution =
  | { status: "unregistered" }
  | { status: "userOnly"; user: User }
  | { status: "complete"; actor: Actor };
```

- Artist を伴う経路（`withArtistReadCapabilitiesById` / `withArtistWriteCapabilitiesById`）は `toAddressedActor` で `Result<Actor, ResolveActorError>` に畳み、`unregistered` を `UserNotFoundError`、`userOnly` を `ArtistNotFoundError`、パスの `artistId` と本人の不一致を `ArtistNotFoundError` として 404 にする
- User スコープで完結する経路（`withUserWriteCapabilitiesById`）は `toAddressedUser` で `Result<User, ResolveUserError>` に畳み、`unregistered` とパスの `userId` の不一致を 404 にする。`userOnly` / `complete` はどちらも `User` として通す
- `GET /users/me` は**未登録が正常系**（オンボーディング動線）。`withIdentityCapabilities` で解決状態をそのまま受け取り、`registered: false` を 200 で返す

「どの状態を失敗に畳むか」は用途ごとの判断であり、解決処理自体には持たせない。畳み込み（`toActor` / `toUser`）は純粋関数として `usecases/authorization/resolution` に置く。

### 経路の入り口は 6 つ

エントリポイントは権能を自分で組み立てず、`usecases/authorization` の**経路モジュール**を直接 import して通す。import パスにその route が乗る経路が現れる。

| 経路モジュール                              | 入り口                                                                | 主体     |
| ------------------------------------------- | --------------------------------------------------------------------- | -------- |
| （`infrastructure/capabilities` を直接）    | `getCapabilityDeps().buildPublicReadCapabilities()`                   | 不要     |
| `usecases/authorization/identity`           | `withIdentityCapabilities(deps, subId, work)`                         | 解決結果 |
| `usecases/authorization/artistRead`         | `withArtistReadCapabilitiesById(deps, subId, artistId, work)`         | Actor    |
| `usecases/authorization/userWrite`          | `withUserWriteCapabilitiesById(deps, subId, userId, work)`            | User     |
| `usecases/authorization/artistWrite`        | `withArtistWriteCapabilitiesById(deps, subId, artistId, work)`        | Actor    |
| `usecases/authorization/artistStorageWrite` | `withArtistStorageWriteCapabilitiesById(deps, subId, artistId, work)` | Actor    |
| `usecases/authorization/registration`       | `withRegistrationCapabilities(deps, work)`                            | 不在     |

経路モジュールが共有する部品は 2 つに分けている。

| モジュール                           | 責務                                                                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `usecases/authorization/resolution`  | `toActor` / `toAddressedActor` / `toUser` / `toAddressedUser`（`ActorResolution` の畳み込み。純粋関数）                 |
| `usecases/authorization/conflict`    | `AlreadyTakenError` と `catchAlreadyTaken`（一意制約違反を `err` に戻す）                                               |
| `usecases/authorization/testDoubles` | 各経路のテストが共有する `CapabilityDeps` のスタブと Entity フィクスチャ（テスト専用のため `index.test.ts` を持たない） |

`index.ts` による再エクスポートは置かない。**どの経路に乗っているかを import パスで示す**ためで、`usecases/authorization` から何でも取れる形にすると経路の選択が見えなくなる。

境界を張るヘルパは、一意制約違反として上がってきた型付きエラーを `err` へ変換する（詳細は [並行更新ポリシー](./database/concurrency.md)）。**変換する型は、その権能で書ける範囲に一致させる。**

| ヘルパ                            | 変換する型                                           |
| --------------------------------- | ---------------------------------------------------- |
| `withUserWriteCapabilitiesById`   | `EmailAlreadyTakenError`                             |
| `withArtistWriteCapabilitiesById` | `EmailAlreadyTakenError` / `HandleAlreadyTakenError` |
| `withRegistrationCapabilities`    | `EmailAlreadyTakenError` / `HandleAlreadyTakenError` |

### トランザクション境界

`runWithUserWriteCapabilities` / `runWithArtistWriteCapabilities` / `runWithRegistrationCapabilities` が境界を張り、権能に束ねる executor をトランザクションに差し替える。Drizzle のトランザクションは throw でしかロールバックしないため、業務エラー（`err`）は内部シグナルに載せて境界の外で復元する。

usecase が `tx` を受け取ることはない。**リポジトリの executor は権能の生成時に注入される**ため、「トランザクション内で動いているか」は usecase から見えない。

Write 系の権能は**単一操作であっても常に境界を張る**。単一文でも Postgres は暗黙のトランザクションで動くため追加コストは `BEGIN` / `COMMIT` の往復分に留まり、その代わりに「この usecase に境界は要るか」という判断そのものを無くせる。単一操作が複数操作に育ったときも、境界側に触れずに原子性が付いてくる（例: handle 変更に履歴の追記が加わった際、usecase の配線を足しただけで同一トランザクションに乗った）。

境界の意味論は経路ごとに 1 つに固定する。既定は **all-or-nothing**（`ok` で commit、`err` / throw で rollback）で、usecase はこれを前提に配線だけを書く。次のように既定と異なる意味論が必要になったら、それは usecase ではなく**境界の設計問題**として扱い、**既存の権能型の意味論を変えずに、別の経路・別の権能型として足す**。

| 要件の例                                | 既定の境界で起きること           | 取るべき形                                                                  |
| --------------------------------------- | -------------------------------- | --------------------------------------------------------------------------- |
| 失敗（`err`）でも一部の記録は残したい   | 記録ごと rollback される         | 境界なし、または独立した境界を持つ Write 権能                               |
| 一括処理で件ごとに確定したい            | 1 件の失敗で全件 rollback される | 件ごとに境界を張る経路モジュール                                            |
| DB 外の書き込み（Storage 等）と揃えたい | 境界は DB 外に効かない           | `ArtistStorageWriteCapabilities` のように境界の外へ分離し、原子性を求めない |

既存の境界を緩める（例: `ArtistWriteCapabilities` で `err` 時も一部を残す）方向には倒さない。usecase の第 1 引数の権能型が「どの整合性の約束のもとで動くか」をそのまま表す状態を保つ。

### Composition Root の分割

`infrastructure/capabilities/index.ts` は**合成だけ**を持つ。中身は関心ごとに分かれており、それぞれ単体でテストできる。

| モジュール                       | 責務                                                              |
| -------------------------------- | ----------------------------------------------------------------- |
| `infrastructure/transaction`     | `Executor` 型と `runInTransaction`（境界の張り方と `err` の復元） |
| `capabilities/resolveActorState` | Reader を受け取り `subId` を `ActorResolution` に解決する         |
| `capabilities/builders`          | `executor → 権能` の組み立て（用途ごとに 1 つの `build*`）        |
| `capabilities/index.ts`          | `db` を確定させ、上記を `CapabilityDeps` に合成する               |

`build*Capabilities` は主体を先に受け、`executor` を後で受ける形（`(subject) => (executor) => Caps`）に揃える。これにより `runInTransaction` にそのまま渡せて、境界の有無で組み立て方が変わらない。

### 権能を経由しない依存取得は存在しない

エントリポイントが参照できる依存の入口は `getCapabilityDeps()` だけである。リポジトリ一式をまとめて配る Composition Root（旧 `getContainer`）は廃止した。usecase は渡された権能以外に到達手段を持たない。

### 権能の迂回は lint で機械的に落とす

上の2点（「usecase は渡された権能以外に到達手段を持たない」「権能は第1引数で受け取る」）は規約に留めず、**ESLint のローカルルールで検出する**。ルールの実体は `eslint.rules.mjs`、適用範囲は `apps/api-server/eslint.config.mjs` で決める。

| ルール                               | 検出する形                                                                                                                                                                                                                                           | 適用範囲                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `local/usecase-capability-boundary`  | `usecases/` から `infrastructure/`・`database`・`drizzle-orm`・`@supabase/*` への import。あわせて、解決先を静的に確認できない dynamic import（変数・式で組み立てたパス）も禁止する                                                                  | `src/usecases/**`（経路モジュール・テストを含む全体）                               |
| `local/usecase-capability-parameter` | エクスポート関数（`export { x }` / `export default x` の分離形を含む）の第1引数が権能型でない。権能型は**型名ではなく出所**で判定し、`usecases/capabilities` から import した型と、それを `Pick` / `Omit` 等で包んだ型・ファイル内の別名だけを認める | `src/usecases/**`（`authorization/` `capabilities/` `testDoubles/` とテストは除外） |

`usecases/authorization`（経路モジュール）は権能を**組み立てる**側で第1引数に `CapabilityDeps` を取り、`resolution` / `conflict` は純粋関数なので、`usecase-capability-parameter` の対象から外す。テストとテストダブルも usecase 本体ではないため同様に外す。一方 `usecase-capability-boundary` は経路モジュールにも効かせる（経路モジュールが知ってよいのは `capabilities` の型までで、DB は `infrastructure/capabilities` の責務）。

**なぜ型ではなく lint か**: 「第1引数は権能である」を型で強制するには `defineUsecase` / `Exact` のようなラッパを全 usecase に被せる必要があるが、上述の通りその型ユーティリティは追加コストに見合わないとして採用していない。ラッパを入れずに同じ制約を機械判定するのが lint の役割で、**型で消せる制約は型で消し、型で消せない構造だけを lint が見る**という役割分担にする。

権能型を型名の接尾辞（`*Caps` / `*Capabilities`）で判定していないのは、raw な db を持つ構造型に `FakeCaps` と名付けるだけでルールを通過できてしまうため。判定の軸は**その型が権能型の定義元から来ているか**に置く。

新しい依存の入口（別の外部クライアント等）を `infrastructure/` に足したときは、`RESTRICTED_USECASE_SOURCES` に追加するか、`infrastructure/` 配下に置いてパスで拾われるようにする。ルール自体の振る舞いは `apps/api-server/eslint.rules.test.mts` で固定している。

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
- **トランザクション境界**: 永続化の原子性の境界（権能の組み立て側の世界）

UserとArtistが別集約であっても、「新規登録時には原子的に作られなければならない」という業務要件があれば、両者にまたがるトランザクションを張ることは正当である。

境界を**どこに置くか**は権能モデルで確定している。`runWithRegistrationCapabilities` のような `run*` ヘルパが境界を持ち、そこで組み立てられた権能のリポジトリはすべて同じトランザクションにバインドされる。usecase は「原子的に書かれること」を前提にしてよく、境界を張る責務は負わない。

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

| 要求                         | インターフェース                 | 実装                        |
| ---------------------------- | -------------------------------- | --------------------------- |
| ユーザーを保存したい         | `IUserWriter.save`               | drizzle で INSERT           |
| トランザクションでまとめたい | `runWithArtistWriteCapabilities` | drizzle の `db.transaction` |
| メールを送りたい             | `IEmailSender.send`              | SendGrid / Resend / SES 等  |
| 画像を保存したい             | `IFileStorage.upload`            | S3 / GCS / ローカル等       |

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
    const result = createUser({
      subId: "auth0|123456789",
      email: "test@example.com",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.getId()).toBeTruthy();
    expect(result.value.getSub()).toBe("auth0|123456789");
    expect(result.value.getEmail()).toBe("test@example.com");
  });

  it("toPersistenceで永続化用データを返す", () => {
    const result = createUser({
      subId: "auth0|123456789",
      email: "test@example.com",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.value.toPersistence();

    expect(data.id).toBeTruthy();
    expect(data.subId).toBe("auth0|123456789");
    expect(data.email).toBe("test@example.com");
  });

  it("無効なemailでInvalidEmailFormatErrorをerrで返す", () => {
    const result = createUser({
      subId: "auth0|123456789",
      email: "invalid-email",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidEmailFormatError");
    }
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

| メソッド | パス                                                | 説明                                                          | 認証 |
| -------- | --------------------------------------------------- | ------------------------------------------------------------- | ---- |
| GET      | `/api/test`                                         | ヘルスチェック                                                | 要   |
| POST     | `/api/users`                                        | ユーザー作成                                                  | 要   |
| GET      | `/api/users/me`                                     | 自分のユーザー情報取得                                        | 要   |
| POST     | `/api/users/:userId`                                | メールアドレス更新                                            | 要   |
| GET      | `/api/artists`                                      | 公開プロフィール一覧                                          | 不要 |
| GET      | `/api/artists/:handle`                              | 公開プロフィール詳細                                          | 不要 |
| POST     | `/api/artists/:artistId`                            | handle 更新（変更履歴を同一トランザクションで記録）           | 要   |
| GET      | `/api/artists/:artistId/profile`                    | プロフィール取得（下書き含む・集約一本）                      | 要   |
| POST     | `/api/artists/:artistId/attributes`                 | 属性の更新                                                    | 要   |
| POST     | `/api/artists/:artistId/story/chapters/:chapterKey` | Story 章の書き込み（空文字で章を消す）                        | 要   |
| POST     | `/api/artists/:artistId/links`                      | SNS リンク集合の差し替え                                      | 要   |
| POST     | `/api/artists/:artistId/profile/publish`            | 公開/非公開の切り替え                                         | 要   |
| POST     | `/api/artists/:artistId/profile/image`              | プロフィール画像の差し替え（アップロード＋集約へ URL を書く） | 要   |
| GET      | `/api/link-types`                                   | リンク種別マスタ一覧                                          | 不要 |
| GET      | `/api/story-questions`                              | Story の問いマスタ一覧（必須フラグ付き）                      | 不要 |

> 旧 `me` 系（`POST /api/artists/me`・`GET|POST /api/artists/me/profile`・`POST /api/artists/me/profile/publish`・`POST /api/users/me`）はクライアント移行の完了に伴い削除済み（[api-design-guidelines.md](./api-design-guidelines.md) のリソースアドレッシング参照）。`GET /api/users/me` だけは、クライアントが自分の `userId` / `artistId` を解決する起点（bootstrap）として存置する。
