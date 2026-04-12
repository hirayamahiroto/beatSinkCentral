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

## レイヤー間のデータフロー

本プロジェクトのクリーンアーキテクチャにおけるデータの流れ:

```
factories（Entityの生成方法を定義）
    ↑ 使用
Infrastructure（DBレコードをfactoriesでEntityに変換）
    ↓ Entityを返す
Usecase（EntityとRepository Interfaceだけを知っている）
    ↓ Entityの振る舞いで組み立てる
Presentation（結果を受け取るだけ）
```

| 層 | やること | 知っていること |
|---|---|---|
| Domain（Entity/factories） | 振る舞いと生成方法を定義 | 自分自身のみ |
| Infrastructure | DBレコード → factories → Entity | DomainとDB |
| Usecase | Entityの振る舞いで組み立て | DomainのみでDBを知らない |
| Presentation | 結果を受け取って返す | Usecaseのみ |

### 重要な原則: UsecaseはEntityの振る舞いを使う

Usecaseでは、Repositoryから返されたEntityの**振る舞い（getter）**を通じてデータにアクセスする。Repositoryの生データに直接依存しない。

```typescript
// ❌ NG: Repositoryが生データを返し、Usecaseが直接参照する
const user = await userRepository.findBySub(sub);  // { id: string; email: string }
return { userId: user.id, email: user.email };

// ✅ OK: RepositoryがEntityを返し、Usecaseは振る舞いで組み立てる
const user = await userRepository.findBySub(sub);  // User Entity
return { userId: user.getId(), email: user.getEmail() };
```

### ユースケースの実装例

```typescript
// usecases/users/index.ts
export const createUserUseCase = async (
  input: CreateUserInput,
  userRepository: IUserRepository
): Promise<CreateUserOutput> => {
  // 1. Repositoryから既存ユーザーをEntityとして取得
  const existingUser = await userRepository.findBySub(input.subId);
  if (existingUser) {
    return { userId: existingUser.getId() };
  }

  // 2. factoryでEntityを生成（ドメインがIDを持つ）
  const user = createUser({
    subId: input.subId,
    email: input.email,
  });

  // 3. Entityの振る舞い(toPersistence)で永続化データに変換し、Repositoryに渡す
  const savedUser = await userRepository.save(user.toPersistence());

  // 4. 保存されたEntityの振る舞いで結果を組み立てる
  return { userId: savedUser.getId() };
};
```

## 設計原則: Functional Core, Imperative Shell

本プロジェクトの層構造は、関数型プログラミングで知られる **Functional Core, Imperative Shell** パターンに一致する。

### 基本原則

> **「データ」「変換」「副作用」を分離し、データはすべて値（Entity/VO）として扱う。**

- **データ** = Entity / Value Object
- **変換** = 純粋関数（Factory, Domain Service）
- **副作用** = Repository経由の永続化、トランザクション、外部API呼び出し

層に対応させると次のようになる。

| 区分 | 該当層 | 性質 |
|---|---|---|
| **Functional Core（純粋な中核）** | Entity / VO / Factory / Domain Service | 副作用なし、値の変換だけ |
| **Imperative Shell（命令的な外殻）** | Usecase / Repository / エントリポイント層 | 副作用とI/Oを持つ |

純粋な中核は再利用可能で、テスト容易で、どこから呼ばれても同じ結果を返す。外殻は「いつ、どこで、どの順序で、どう永続化するか」という実行時の関心事だけを担う。

### Entityを明示的に取り回す設計

Usecase層ではEntityインスタンスを変数として明示的に保持し、処理の各ステップで「何が生まれ、何が次に渡るか」を可視化する。

```typescript
const existing = await userRepository.findBySub(input.subId);  // 入力
const user = createUser(input);                                 // 合成
const saved = await userRepository.save(user.toPersistence());  // 永続化
return { userId: saved.getId() };                               // 出力
```

この取り回しが次の性質を生む。

- **データフローが追跡可能** — 各行で「何が起きているか」が変数として見える
- **隠れた状態がない** — モジュールスコープのキャッシュ、クラスのプライベートフィールド、サービスの内部連鎖が無い
- **参照のグラフが型と変数で明示される** — Entity間の参照が代入の順序として現れる

「処理は引数と返り値だけで完結している」状態を保つことで、読む人が別ファイルを何個も開かずに Usecase 1つで全体像を把握できる。

### Domain Service: 集約を跨ぐドメインロジックの置き場所

単一のEntity/VOでは表現できない業務ルール（複数の集約にまたがる操作）は **Domain Service** として純粋関数で表現する。

```
domain/
└── services/
    └── {serviceName}/
        └── index.ts     # 入力 → 複数の Entity を組み立てて返す純粋関数
```

#### 配置の条件

Domain Serviceは次の条件を満たす場合に置かれる。

- 複数のEntity/VOを組み合わせる業務ルールである
- 状態を持たない（呼び出すたびに同じ結果）
- **副作用を持たない**（DB・外部APIに触れない）
- 入力として生の値を受け取り、出力としてEntity群を返す

#### 実装例

```typescript
// domain/services/userRegistration/index.ts
export const registerNewUser = (input: {
  subId: string;
  email: string;
  accountId: string;
}): {
  user: User;
  artist: Artist;
  owner: ArtistOwner;
} => {
  const user = createUser({ subId: input.subId, email: input.email });
  const artist = createArtist({ accountId: input.accountId });
  const owner = createArtistOwner({
    userId: user.getId(),
    artistId: artist.getArtistId(),
  });
  return { user, artist, owner };
};
```

このサービスは Repository を知らず、DB を知らず、トランザクションも知らない。ただ Entity を組み立てて返すだけ。

#### Usecase との組み合わせ

```typescript
// usecases/users/createUser/index.ts
export const createUserUseCase = async (input, deps) => {
  // 業務上の前提チェック（Usecase層の責務）
  const existing = await deps.userRepository.findBySub(input.subId);
  if (existing) throw createUserAlreadyRegisteredError(input.subId);

  // ドメインサービスで「作るべきもの」を組み立てる（純粋、副作用なし）
  const { user, artist, owner } = registerNewUser(input);

  // トランザクション境界を張って永続化（Usecase層の責務）
  return await deps.txRunner.run(async (tx) => {
    await deps.userRepository.save(user.toPersistence(), tx);
    await deps.artistRepository.save(artist.toPersistence(), tx);
    await deps.artistOwnerRepository.save(owner.toPersistence(), tx);
    return {
      userId: user.getId(),
      artistId: artist.getArtistId(),
    };
  });
};
```

**役割分担の明確化:**

| 層 | このフローで担当していること |
|---|---|
| Domain Service | 「新規登録では User + Artist + Owner を作る」という**業務ルール** |
| Usecase | 既存チェック、トランザクション境界、永続化、エラーハンドリング |
| Repository | 各Entityの個別永続化 |

Usecaseは「業務ルール」を書かず、Domain Serviceは「トランザクション・永続化」を書かない。責務が一切重複しない。

### ブラックボックス化と名前付けの違い

Domain Service を入れることは「層を増やしてブラックボックス化する」ことではない。これは「純粋関数に業務ルールの**名前を付けた**」だけである。

| ブラックボックス化（悪） | 名前付け（良） |
|---|---|
| 内部で副作用を持つ（DB呼び出し、グローバル状態変更） | 純粋関数で入力→出力だけ |
| 何が渡されて何が返るかが型から読めない | 型シグネチャで全てが表現される |
| 呼び出すと「何かが起きる」 | 呼び出すと「値が返る」だけ |
| デバッグに関係ファイル全部を開く必要がある | 型を見れば中身を読まなくても使える |

Domain Serviceが純粋関数である限り、Usecase層から見たデータフローの明示性は損なわれない。むしろ「新規登録では User + Artist + Owner が作られる」という業務ルールが `registerNewUser` という名前に紐づくことで、Usecaseが何をしているかがより読みやすくなる。

### 集約とトランザクション境界の分離

DDDでは伝統的に「1トランザクション = 1集約」と言われるが、実務では次のように分けて考える。

> **集約境界 ≠ トランザクション境界**

- **集約境界** はドメインモデル上の不変条件の境界（Entity/VOの世界）
- **トランザクション境界** は永続化の原子性の境界（Usecase/Repositoryの世界）

User と Artist が別集約であっても、「新規登録時には原子的に作られなければならない」という業務要件があれば、Usecase層が両者にまたがるトランザクションを張ることは正当である。この分離により:

- ドメインの表現力（集約を小さく保つ）
- 技術的な整合性（原子性の保証）

の両方を同時に達成できる。

### Atomic Design との類似

この構造は Atomic Design（フロントエンドの設計原則）と同型の発想に基づく。

| Atomic Design | バックエンドでの対応 | 責務 |
|---|---|---|
| Atom | Entity / VO | 最小単位のドメイン概念 |
| Molecule | Domain Service | 原子を業務ルールで組み立てる |
| Organism | 複合Domain Service（必要時） | より大きな業務フロー |
| Template | Usecase | 副作用（永続化・トランザクション）を含む実行フロー |
| Page | エントリポイント層 | 具体的なプロトコル（HTTP）への結合 |

共通するのは「**純粋な原子 → 文脈をまとう合成 → 副作用を持つ実行**」という一方向の依存。下位層ほど再利用可能で、上位層ほど具体的な文脈を持つ。

### Outside-In 設計の実例: TransactionRunner

ここまでの原則を実際の設計判断にどう適用するか、`infrastructure/transaction/index.ts` の `ITransactionRunner` を例に追ってみる。

#### 思考の順序

```
1. 「トランザクションが必要」という業務上の要求を認識
       ↓
2. 「複数の Usecase で使い回されるはず」と将来を見据える
       ↓
3. 「Usecase が呼びたい形」を先に決める → ITransactionRunner という抽象を定義
       ↓
4. 「Usecase ではこう使う」を実装してみる → run(async (tx) => { ... })
       ↓
5. ここで初めて「drizzle でどう実装するか」を考える → createTransactionRunner
```

これは **Outside-In（外側から内側へ）** または **インターフェース先行設計** と呼ばれる進め方で、クリーンアーキテクチャの依存関係逆転（DIP）を自然に実現する手順。

#### なぜこの順序が良いか

1. **「使う側のニーズ」が設計の起点になる**
   - Repository / Infrastructure の都合ではなく、Usecase が何を欲しているかから逆算する
   - 結果として、抽象は「使う側にとって最小・最適な形」になる
2. **実装手段を後から決められる**
   - drizzle じゃなくてもよい（Prisma に変えても、Knex に変えても、生 SQL でも）
   - 抽象が固まっていれば、後から実装を差し替えられる
   - テストでも fake な実装を差し込める
3. **抽象が drizzle に汚染されない**
   - 先に `db.transaction()` から考え始めると、drizzle 固有の概念（PgTransaction の細かい型、ネスト時の挙動など）が抽象に染み出してしまう
   - Outside-In だと抽象は「業務として必要な最小限」に保たれる

#### 一般化されたパターン

```
[業務上の要求]
   ↓ 「何が必要か」を言語化
[使う側のインターフェース]   ← Usecase / ドメイン側が依存する
   ↓ 「具体的にどう実現するか」
[実装]   ← Infrastructure / ライブラリ依存
```

このパターンは TransactionRunner だけでなく、Repository、外部APIクライアント、メール送信、ファイルストレージなど、Infrastructure に何かを配置するときに常に使える思考法。

| 要求 | インターフェース | 実装 |
|---|---|---|
| ユーザーを保存したい | `IUserRepository.save` | drizzle で INSERT |
| トランザクションでまとめたい | `ITransactionRunner.run` | drizzle の `db.transaction` |
| メールを送りたい | `IEmailSender.send` | SendGrid / Resend / SES 等 |
| 画像を保存したい | `IFileStorage.upload` | S3 / GCS / ローカル等 |

全て同じ手順で次のように進める。

1. 業務上の要求を確認
2. 使う側が呼びやすいインターフェースを設計
3. 後から具体実装を決める

#### 実装手順の具体

```typescript
// Step 1: 使う側（Usecase）が呼びたい形を想像する
//   await txRunner.run(async (tx) => { ... })

// Step 2: その形を満たすインターフェースを定義
export interface ITransactionRunner {
  run<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T>;
}

// Step 3: drizzle を使って実装（後から書ける）
export const createTransactionRunner = (
  db: DatabaseClient
): ITransactionRunner => ({
  async run<T>(fn) {
    return db.transaction(fn);
  },
});

// Step 4: DI Container で組み立てて Usecase に渡す
const txRunner = createTransactionRunner(db);
```

実装の具体（Step 3）は最後で構わない。それまでの思考は drizzle を一切知らなくても進められる。

#### Outside-In 設計の副次的な効果

抽象を先に切ったことで、テストで fake を差し込めるようになる。

```typescript
// Usecase のテストでは fake な txRunner を差し込める
const fakeTxRunner: ITransactionRunner = {
  run: async (fn) => fn(null as never), // tx は使わないので null でOK
};

await createUserUseCase(input, {
  txRunner: fakeTxRunner,
  // ... 他の Repository モック
});
```

drizzle を一切ロードせずに Usecase の振る舞いを検証できる。これは Outside-In で抽象を切ったから可能になっていること。

### 帰結: 各層のテスト戦略が自然に決まる

この設計原理から、各層のテスト戦略も自然に決まる。

| 層 | テスト対象 | モックの要否 |
|---|---|---|
| Entity / VO | ドメイン制約 | 不要（純粋） |
| Factory | 生成ロジック | 不要（純粋） |
| Domain Service | 組み立てロジック | 不要（純粋関数） |
| Usecase | フロー・分岐・エラーハンドリング | Repository をモック |
| Repository | CRUDの実装 | DBをモック |
| エントリポイント | プロトコル変換 | Container/Usecase をモック |

純粋な中核は副作用がないのでモック不要、外殻だけモックが必要、という綺麗な構図になる。

---

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

- RepositoryからEntityを取得し、**Entityの振る舞いで結果を組み立てる**
- DBの構造やカラム名を知らない（Entityの振る舞いのみ使用）
- 新規作成時はfactoryでEntityを生成し、`toPersistence()`で永続化データに変換

### リポジトリ層

リポジトリは**インターフェース（ドメイン層）**と**実装（インフラ層）**に分離される。

#### インターフェース (`domain/{object}/repositories/`)

```typescript
// ドメイン層：永続化データの型とインターフェース定義
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

- `save` は `UserSaveData`（Entityの `toPersistence()` の戻り値）を受け取り、永続化後に `User` エンティティを返す
- `findBySub` は `User` エンティティを返す（生データではない）

#### 実装 (`infrastructure/repositories/{object}/`)

```typescript
// インフラ層：実装（reconstructUserでDB → Entityに変換）
export const createUserRepository = (db: DatabaseClient): IUserRepository => ({
  async save(data: UserSaveData): Promise<User> {
    const [result] = await db
      .insert(usersTable)
      .values(data)
      .returning({ id: usersTable.id, subId: usersTable.subId, email: usersTable.email });

    return reconstructUser({ id: result.id, subId: result.subId, email: result.email });
  },

  async findBySub(sub: string): Promise<User | null> {
    const results = await db
      .select({ id: usersTable.id, subId: usersTable.subId, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.subId, sub))
      .limit(1);

    if (results.length === 0) return null;

    const row = results[0];
    return reconstructUser({ id: row.id, subId: row.subId, email: row.email });
  },
});
```

**ポイント**: Repository実装は常に `reconstructUser`（factory）を使ってDBレコードをEntityに変換する。

#### 層間のアクセス方向

```
UseCase → Repository（インターフェース） → Entity
              ↑
        Repository（実装） → factories/reconstructUser → Entity
                          → DB
```

| 層 | アクセス先 | 役割 |
|---|---|---|
| UseCase | Repository（抽象）+ Entity振る舞い | DBに直接アクセスしない |
| Repository実装 | factories + DB | DBとEntityの橋渡し |
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
  readonly id: string;
  readonly subId: Sub;
  readonly email: Email;
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

#### 注意: behaviorsのgetterとドメイン貧血症を混同しない

プロジェクト初期ではEntity の振る舞いがgetterと`toPersistence`のみになる。これを「ドメイン貧血症」と判断してbehaviorsを削除し、Stateを直接返す設計にすると**カプセル化が壊れる**。

```typescript
// ❌ NG: behaviorsを削除してStateを直接返す
const user = await userRepository.findBySub(sub);  // UserState
return { email: user.email.value };  // UsecaseがValueObjectの内部構造(.value)を知っている

// ✅ OK: behaviorsを通じてプリミティブを返す
const user = await userRepository.findBySub(sub);  // User（振る舞い付き）
return { email: user.getEmail() };  // Usecaseは内部構造を知らない
```

getterの役割は2つある:
1. **ドメインロジックの実行**（判定、状態変更）← ドメインが成長すると追加される
2. **内部構造の隠蔽**（カプセル化）← **プロジェクト初期から必要**

getterにドメインロジックがないことは問題ではない。Entityの前提である「内部の詳細を閉じ込めて、外には振る舞いのみを提供する」を維持するために、behaviorsは必要。

### エンティティ層 (`domain/{object}/entities/`)

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

### 振る舞い層 (`domain/{object}/behaviors/`)

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

**ポイント**: `state`はクロージャに閉じ込められ、外部からアクセスできない。`toPersistence()`は永続化用のプレーンデータに変換する振る舞い。

### ファクトリ層 (`domain/{object}/factories/`)

Entityの**生成方法**を実装。用途に応じて複数のファクトリを用意。

```typescript
import { createSub } from "../valueObjects/sub";
import { createEmail } from "../valueObjects/email";
import { createUserBehaviors } from "../behaviors";
import type { User } from "../entities";

// 新規作成用（UseCase層で使用）
export const createUser = (params: { subId: string; email: string }): User => {
  const state = {
    id: crypto.randomUUID(),  // ドメインがIDを生成
    subId: createSub(params.subId),
    email: createEmail(params.email),
  };
  return createUserBehaviors(state);
};

// DB復元用（Repository層で使用）
export const reconstructUser = (params: { id: string; subId: string; email: string }): User => {
  const state = {
    id: params.id,
    subId: createSub(params.subId),
    email: createEmail(params.email),
  };
  return createUserBehaviors(state);
};
```

#### ファクトリの使い分け

| ファクトリ | 用途 | ID |
|-----------|------|----|
| `createUser` | 新規作成（UseCase） | `crypto.randomUUID()`で自動生成 |
| `reconstructUser` | DB復元（Repository） | 引数から受け取る |

### カプセル化の確認

```typescript
const user = createUser({ subId: "auth0|123", email: "test@example.com" });

// ✅ 振る舞いを通じてアクセス
user.getId();
user.getEmail();
user.toPersistence();

// ❌ 内部プロパティに直接アクセス不可
user.id;     // エラー: プロパティが存在しない
user.state;  // エラー: プロパティが存在しない
```

### 処理の流れ

```
factories/createUser(params)
    │
    ├─ 1. IDを生成（crypto.randomUUID）
    │
    ├─ 2. 値オブジェクト作成（createSub, createEmail）
    │
    ├─ 3. 内部状態（UserState）を組み立て
    │
    └─ 4. behaviors/createUserBehaviors(state) に渡す
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
│   │   ├── getId()/getSub()/getEmail()で正しい値を返すこと
│   │   └── toPersistence()で永続化データを返すこと
│   └── reconstructUser: DB復元の振る舞い検証
│       └── 指定したid/subId/emailがgetterで取得できること
│
├── Behaviors テスト（必要に応じて）
│   └── 公開メソッドの動作検証（getter, toPersistence等）
│
└── Value Objects テスト
    ├── Sub: バリデーション詳細
    └── Email: バリデーション詳細
```

### テストアプローチの変更点

| 観点 | 旧パターン | クロージャパターン |
|------|-----------|------------------|
| 内部状態 | プロパティで直接アクセス | getter/toPersistenceを通じて検証 |
| 値オブジェクト | spyで呼び出し確認 | 不要（振る舞いで検証） |
| カプセル化 | 弱い | 強い（クロージャで隠蔽） |

### Factoryのテスト例

```typescript
describe("createUser", () => {
  it("有効なパラメータでUserを作成し、振る舞いで正しい値を返す", () => {
    const user = createUser({
      subId: "auth0|123456789",
      email: "test@example.com",
    });

    expect(user.getId()).toBeTruthy();  // UUIDが生成されている
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
      createUser({
        subId: "auth0|123456789",
        email: "invalid-email",
      })
    ).toThrow();
  });
});

describe("reconstructUser", () => {
  it("有効なパラメータでUserを復元し、getterで正しい値を返す", () => {
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

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET/POST | `/api/test` | ヘルスチェック |
| POST | `/api/users/create` | ユーザー作成 |
