# エラーハンドリング実装パターン

[layer-responsibilities.md](./layer-responsibilities.md) で定めた責務分離を、コードレベルでどう実現するかを定める。

本ドキュメントのスコープ:

- エラーをどう書くか（`type` + factory + assert）
- クライアント向けレスポンスと内部ログへの変換をどう共通化するか（`errorMap` / `Logger`）
- ルートハンドラに何を書かない / 書くか（`onError`）
- 新しいエラーを追加する手順

設計思想は [concepts.md](./concepts.md)、運用への接続（ログ基盤・SLO）は [operations.md](./operations.md) を参照。

---

## 全体像

6つの部品で構成する。

| 部品                     | 位置                                                      | 責務                                                                   |
| ------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------- |
| ① エラー定義             | 各レイヤーに co-located                                   | `type + factory + (必要なら) assert関数` を定義                        |
| ② errorMap               | `apps/api-server/src/errorMap/`                           | エラー種別 → **クライアント向けレスポンス** と **内部ログ** の変換表   |
| ③ onError                | Hono のルートエントリ                                     | 投げられたエラーを errorMap に引き当てて、ログ出力とレスポンス化を行う |
| ④ ルート                 | 各 API ルート                                             | try/catch せずに throw させる（onError が受け取る）                    |
| ⑤ Logger                 | `apps/api-server/src/utils/logger/`                       | ログの出力先を差し替え可能にする抽象（既定は console）                 |
| ⑥ リクエストコンテキスト | `apps/api-server/src/{utils,middlewares}/requestContext/` | リクエスト相関 ID を 1 回だけ確定させ、ログに載せる                    |

### 処理フロー

```text
┌─────────────────────────────────────────────────────────────┐
│ クライアント                                                │
└────────┬────────────────────────────────────────────────────┘
         │ HTTP Request
         ▼
┌─────────────────────────────────────────────────────────────┐
│ ④ ルートハンドラ                                            │
│    認証 / zod バリデーション / usecase 呼び出し             │
│    （try/catch は書かない）                                 │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ usecase / domain                                            │
│    ルール違反を検知したら ① で定義したエラーを throw        │
└────────┬────────────────────────────────────────────────────┘
         │ throw
         ▼
┌─────────────────────────────────────────────────────────────┐
│ ③ onError (Hono)                                            │
│    error.type を見て ② errorMap を引き、2方向に分けて出す    │
│      → クライアント: status + clientMessage (+ clientDetails)│
│      → 内部ログ:     logLevel + errorType + logFields       │
│    未知のエラーは 500（内部ログにのみ詳細を残す）           │
└─────────────────────────────────────────────────────────────┘
```

同じエラー1件から**宛先の異なる2つの出力**が作られる。クライアント向けは「ユーザーが次の行動を取れる情報」に絞り、内部ログは「開発者が原因を特定できる情報」を持つ。両者は同じ表から引くが、混ざらない。

---

## ① エラー定義（co-location）

エラーは **ルールを知っているレイヤー** に置く。「usecase 固有の前提違反」は usecase 配下、「ドメインの不変条件違反」はドメイン配下。配置の詳細は [layer-responsibilities.md](./layer-responsibilities.md) の「配置ルール」を参照。

### class 不使用の方針

プロジェクト全体の方針（Entity/VOはtype + ファクトリ関数）に揃え、**エラーもclassを使わず `type + ファクトリ関数` を基本セットで定義する**。

- **type**: `Error` を基底に、判別用の `type` フィールドと固有のコンテキスト情報を持つ型
- **ファクトリ関数**: `create{ErrorName}` 命名で `Error` インスタンスを生成し `Object.assign` でフィールドを付与
- **型ガード関数 (`isXxxError`)**: errorMap 側が `type` フィールドで判別するため **原則不要**。レイヤーをまたいで型で分岐したい場合のみ定義する

`Error` を基底に使うのはスタックトレース・`throw` 互換性のため（JSの制約上、ここだけは `new Error()` が必要）。判別は `instanceof` ではなく **`type` フィールド** で行う。

### 実装テンプレート

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

export const assertNotRegistered = (userIfRegistered: User | null): void => {
  if (userIfRegistered) throw createUserAlreadyRegisteredError();
};
```

コンテキスト情報を型に載せたい場合（例: `accountId` を文言やログフィールドに使いたい）は、該当フィールドを type に追加して factory が受け取る形にする。宛先ごとの使い分けは errorMap 側で決めるので、ドメインは「どんな文脈だったか」だけを持たせる。

```typescript
// domain/artists/errors.ts（コンテキスト付きの例）
export type AccountIdAlreadyTakenError = Error & {
  readonly type: "AccountIdAlreadyTakenError";
  readonly accountId: string;
};

export const createAccountIdAlreadyTakenError = (
  accountId: string,
): AccountIdAlreadyTakenError => {
  const error = new Error(
    `Account ID already taken: ${accountId}`,
  ) as AccountIdAlreadyTakenError;
  return Object.assign(error, {
    type: "AccountIdAlreadyTakenError" as const,
    accountId,
  });
};
```

### co-location の原則

- エラー型と、そのエラーを投げる判定ロジック（assert関数）は同じディレクトリに置く
- HTTP のことを知ってはいけない（status コードはここには書かない）
- 共通基底（`UseCaseError` 等）は現時点では作らない

---

## ② errorMap

全エラーを `type` をキーとしたテーブルで一元管理する。HTTP と内部ログへの変換表であり、**ドメインや usecase から import されてはいけない**（方向: errorMap → 各レイヤー）。

### 配置

```text
apps/api-server/src/errorMap/
├── index.ts
└── index.test.ts
```

### マッピングの型: 宛先ごとに接頭辞で分ける

1エントリが **クライアント向け（`client*`）** と **内部ログ向け（`log*`）** の2面を持つ。どちらの宛先に出る値かがフィールド名で判別できるため、レビュー時に「これはユーザーに見えるのか」を型定義だけで判断できる。

```typescript
type ErrorMapping<SpecificError extends AppError> = {
  status: ErrorStatusCode;
  clientMessage: (error: SpecificError) => string;
  clientDetails?: (error: SpecificError) => unknown;
  logLevel: LogLevel;
  logFields?: (error: SpecificError) => LogFields;
};
```

| フィールド      | 宛先         | 必須 | 役割                                                     |
| --------------- | ------------ | ---- | -------------------------------------------------------- |
| `status`        | クライアント | ○    | HTTP ステータス                                          |
| `clientMessage` | クライアント | ○    | ユーザーが次の行動を判断できる文言                       |
| `clientDetails` | クライアント | −    | フォーム inline 表示等に使う構造化情報（zod issues 等）  |
| `logLevel`      | 内部ログ     | ○    | 監視上の重要度（後述の付与ルールに従う）                 |
| `logFields`     | 内部ログ     | −    | 調査に必要なドメインコンテキスト（**明示したものだけ**） |

### 実装テンプレート

```typescript
// apps/api-server/src/errorMap/index.ts
const errorMap: ErrorMap = {
  UserAlreadyRegisteredError: {
    status: 409,
    clientMessage: () => "User already registered",
    logLevel: "info",
  },
  AccountIdAlreadyTakenError: {
    status: 409,
    clientMessage: (error) => `Account ID already taken: ${error.accountId}`,
    logLevel: "info",
    logFields: (error) => ({ accountId: error.accountId }),
  },
};

const buildClientResponse = <SpecificError extends AppError>(
  error: SpecificError,
): ClientResponse => {
  const mapping = resolveMapping(error);
  const body: ClientResponse["body"] = { error: mapping.clientMessage(error) };
  if (mapping.clientDetails) {
    body.details = mapping.clientDetails(error);
  }
  return { body, status: mapping.status };
};

const buildErrorLog = <SpecificError extends AppError>(
  error: SpecificError,
): ErrorLog => {
  const mapping = resolveMapping(error);
  const fields: LogFields = { errorType: error.type, status: mapping.status };
  if (mapping.logFields) {
    fields.context = mapping.logFields(error);
  }
  return { level: mapping.logLevel, event: "AppError", fields };
};

export const createAppErrorHandler =
  (logger: Logger) => (error: Error, c: Context) => {
    if (isAppError(error)) {
      emit(logger, buildErrorLog(error));
      const { body, status } = buildClientResponse(error);
      return c.json(body, status);
    }
    emit(logger, buildUnhandledErrorLog(error));
    return c.json({ error: "Internal Server Error" }, 500);
  };

export const handleAppError = createAppErrorHandler(createConsoleLogger());
```

### 設計ポイント

- `AppError` は union 型。**新しいエラーを追加したら union に足す → errorMap のキー補完が効く** ので、マッピングの漏れを型で防げる
- `clientMessage` / `logFields` を関数にしておくと、エラーのコンテキスト情報（`accountId` 等）を宛先ごとに差し込める
- `logLevel` は**必須**。新しいエラーを追加する時点で「これは監視上どの重さか」を必ず考える形にしている
- ログに出るのは **`logFields` で明示的に宣言したフィールドだけ**（ホワイトリスト方式）。エラーオブジェクトを丸ごと spread しないため、後からエラー型にセンシティブな値を足しても勝手にログへ漏れない
- ログには `clientMessage` を含めない。文言はプレゼンテーションの都合で変わるが、集計軸は `errorType` で足りる
- 公開 API は `handleAppError`（console 配線済み）と `createAppErrorHandler`（logger 注入用）。ビルダ群は実装詳細として閉じる

### 未知のエラーの扱い

`isAppError` にマッチしないエラーは、**クライアントには内部事情を一切返さず** `500 / "Internal Server Error"` に落とす。一方で内部ログには調査に必要な `errorName` / `message` / `stack` を残す。「クライアントには出さないが、ログには残す」という非対称が成立するのがこの分離の実利。

---

## ③ onError ハンドラ

Hono の `onError` で一元的に捕捉し、errorMap が公開する `handleAppError` をそのまま渡す。ルートハンドラでは `try/catch` を書かず、onError 側も HTTP 変換の詳細を持たない（詳細は `errorMap` 側に閉じる）。

```typescript
// app/api/[[...route]]/route.ts
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { handleAppError } from "../../../errorMap";

const app = new Hono()
  .basePath("/api")
  .route("/users", usersRoute)
  // ... 他ルート
  .onError(handleAppError);

export const GET = handle(app);
export const POST = handle(app);
```

### 注意点

- **zod バリデーションエラー** も同じ経路に流す。`zValidator` の第3引数フックで `InvalidRequestFormatError` を `throw` する設計に揃え、`onError → handleAppError → errorMap` で 400 + `details` に変換する（フック内で `c.json(..., 400)` を直書きしない）。実装は後述の `validateRequest` ファクトリを参照
- **認証ミドルウェアのエラー** も同じ経路に流す。`requireAuthMiddleware` は `UnauthorizedError` を throw し、errorMap が 401 に変換する。ミドルウェア内で `c.json(..., 401)` を直書きしないのは、直書きすると 401 だけログ経路から外れて観測できなくなるため
- **Infrastructure 層の技術的例外**（DB接続失敗等）は `isAppError` にマッチせず 500 に落ちる。これで正しい（500 はまさに "依存先の契約違反" の表現）

---

## ④ ルートハンドラ

エラーを try/catch しない。usecase を呼んで結果を返すだけ。zod バリデーションエラーも `validateRequest` ファクトリ経由で `onError` に流すので、ハンドラ内に 400 のレスポンス組み立ては書かない。

### InvalidRequestFormatError と validateRequest ファクトリ

エントリポイント層に「リクエスト形式違反」のエラーを co-located で置き、その throw 処理を共通ファクトリに包む。

```typescript
// app/api/[[...route]]/errors/invalidRequestFormat/index.ts
import type { ZodIssue } from "zod";

export type InvalidRequestFormatError = Error & {
  readonly type: "InvalidRequestFormatError";
  readonly issues: ReadonlyArray<ZodIssue>;
};

export const createInvalidRequestFormatError = (
  issues: ReadonlyArray<ZodIssue>,
): InvalidRequestFormatError => {
  const error = new Error(
    "InvalidRequestFormatError",
  ) as InvalidRequestFormatError;
  return Object.assign(error, {
    type: "InvalidRequestFormatError" as const,
    issues,
  });
};
```

```typescript
// app/api/[[...route]]/validators/validateRequest/index.ts
import { zValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";
import { createInvalidRequestFormatError } from "../../errors/invalidRequestFormat";

type ValidationTarget =
  | "json"
  | "form"
  | "query"
  | "header"
  | "cookie"
  | "param";

export const validateRequest = <Schema extends ZodSchema>(
  target: ValidationTarget,
  schema: Schema,
) =>
  zValidator(target, schema, (result) => {
    if (!result.success) {
      throw createInvalidRequestFormatError(result.error.issues);
    }
  });
```

`InvalidRequestFormatError` は `AppError` union に追加し、`errorMap` で 400 + `details: error.issues` にマッピングする（②の `details?` を実装する）。これで「フォーム未入力 → クライアントへフィールド単位のメッセージ」までが onError 経路 1 本で完結する。

### ルート実装例

```typescript
// app/api/[[...route]]/users/create/index.ts
import { Hono } from "hono";
import { z } from "zod";
import { createUserUseCase } from "...";
import { validateRequest } from "../../validators/validateRequest";

const requestSchema = z.object({
  email: z.string().min(1, "email is required").email("Invalid email format"),
  accountId: z
    .string()
    .min(1, "accountId is required")
    .max(255, "accountId must be 255 characters or less"),
});

const app = new Hono().post(
  "/",
  validateRequest("json", requestSchema),
  async (c) => {
    const body = c.req.valid("json");
    const session = await auth0.getSession();
    if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

    // try/catch 不要。AppError も未知のエラーも onError が拾う
    const result = await createUserUseCase(
      { subId: session.user.sub, email: body.email, accountId: body.accountId },
      getContainer(),
    );

    return c.json({ userId: result.userId, artistId: result.artistId }, 201);
  },
);

export default app;
```

各 zod ルールに渡したメッセージは、レスポンス `details[].message` にそのまま乗るのでクライアントのフォーム inline 表示に使える。

一方で**同じ issues をそのまま内部ログには出さない**。zod の issue は種類によって入力値そのもの（`received`）を含むため、ログには `issuePaths`（どのフィールドで失敗したか）だけを載せる。クライアントに返すのはユーザー自身の入力のエコーバックなので問題ないが、ログは残り続ける前提で扱う。

---

## ⑤ Logger

`console.*` を直接呼ばず、Logger 抽象を経由する。出力先を差し替えるための最小の境界であり、errorMap 側は「どこに出るか」を知らない。

```typescript
// apps/api-server/src/utils/logger/index.ts
export type LogLevel = "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

export type Logger = {
  [Level in LogLevel]: (event: string, fields: LogFields) => void;
};

export const createConsoleLogger = (): Logger => ({
  info: (event, fields) => console.info(event, fields),
  warn: (event, fields) => console.warn(event, fields),
  error: (event, fields) => console.error(event, fields),
});
```

- 第1引数は `event`（`"AppError"` / `"UnhandledError"`）、第2引数は構造化フィールド。文字列連結でメッセージを組み立てない（監視基盤で次元として扱えなくなる）
- 本番で pino / Datadog SDK に差し替える場合も、実装するのは `Logger` 1本だけ（`errorMap` / エラー定義 / ルートは変更ゼロ）
- テストでは `createAppErrorHandler(fakeLogger)` に記録用の実装を渡し、`console` の spy に依存せず「どの level にどのフィールドが出たか」を検証する

---

## ⑥ リクエストコンテキスト

「どのリクエストで起きたか」を追うための相関情報を、ログ出力時に合成する。

```typescript
// route.ts: 認証より前に置き、401 のログにも相関情報が乗るようにする
const app = new Hono()
  .basePath("/api")
  .use("*", requestContextMiddleware)
  .use("/users/*", requireAuthMiddleware);

// errorMap の emit で合成する
const emit = (
  logger: Logger,
  c: Context,
  { level, event, fields }: ErrorLog,
) => {
  logger[level](event, {
    ...getRequestContext(), // requestId / traceId
    method: c.req.method,
    route: c.req.routePath,
    ...fields,
  });
};
```

出力されるログの形:

```json
{
  "requestId": "iad1::abc-123",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "method": "POST",
  "route": "/api/artists/me/profile",
  "errorType": "ProfileNotPublishableError",
  "status": 422,
  "context": { "missingFields": ["story"] }
}
```

- `requestId` / `traceId` は **1 リクエストに 1 回だけ確定させる値**なので `AsyncLocalStorage` に置く
- `method` / `route` は `c` から常に導出できるので保持しない
- `route` を middleware で読むと `/api/*` になる（Hono の仕様）。詳細と PII の扱いは [operations.md](./operations.md) の「リクエスト相関情報の注入」を参照

---

## 新しいエラーを追加する手順

```text
1. エラーを投げるレイヤーを決める（domain / usecase）
2. 該当ディレクトリに co-located で type + factory (+ assert関数) を定義
3. errorMap/index.ts の AppError union に型を追加
   → TypeScriptが errorMap の未実装キーを指摘する
4. errorMap に status / clientMessage / logLevel を実装
   （必要なら clientDetails / logFields も）
5. usecase / policy から throw する
```

ルートハンドラも onError も **触らない**。これが本設計の最大のメリット。

---

## 設計上の利点

- **追加コスト最小**: 新エラーは「co-located 定義 + errorMap に1エントリ」だけ。ルート / onError / Logger は不変
- **型で網羅性を強制**: AppError union に追加すれば errorMap のキーは型で補完される → マッピング漏れをコンパイル時に検知
- **レイヤーの独立性維持**: ドメイン / usecase は HTTP もログも知らない。errorMap だけが橋渡しをする
- **宛先の混同を防ぐ**: `client*` / `log*` の接頭辞で、その値がユーザーに見えるのかログに残るのかが型定義だけで分かる
- **テスト容易性**: usecase のテストは「適切なエラーを throw するか」だけを検証すればよい。HTTP 変換とログ出力は errorMap のユニットテストで独立に検証可能
