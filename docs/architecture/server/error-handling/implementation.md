# エラーハンドリング実装パターン

[layer-responsibilities.md](./layer-responsibilities.md) で定めた責務分離を、コードレベルでどう実現するかを定める。

本ドキュメントのスコープ:

- 失敗をどう表すか（`Result<T, E>`）
- エラーをどう書くか（`type` + factory）
- HTTPレスポンスへの変換をどう共通化するか（`errorMap`）
- ルートハンドラに何を書かない / 書くか（`handleAppError` / `onError`）
- 新しいエラーを追加する手順

設計思想は [concepts.md](./concepts.md)、運用への接続（ログ基盤・SLO）は [operations.md](./operations.md) を参照。

---

## 大原則: 業務上の失敗は `Result` で返す

**想定内の失敗（値が不正・対象が存在しない・業務ルール違反）は `throw` しない。`Result<T, E>` の `err` として返す。**

`throw` は「その関数が失敗しうる」ことを型に現さない。呼び出し元は実装を読むまで失敗の可能性に気づけず、usecase のシグネチャからも失敗が消える。`Result` にすると失敗が戻り値の型に現れ、`if (!result.ok)` を書かないとコンパイルが通らない。

`throw` を使うのは次の 2 つだけ。

| 用途                                                 | 例                                                        |
| ---------------------------------------------------- | --------------------------------------------------------- |
| 到達してはならない状態（プログラム誤り・データ破損） | DB から復元した値が VO の制約に反する（`unwrapOrThrow`）  |
| エントリポイント層の形式検証                         | zod の検証失敗（`InvalidRequestFormatError` → `onError`） |

前者は 500 に落ちるべき事象であり、クライアントに返す業務エラーではない。後者は Hono のミドルウェア層で起きるため戻り値を持てず、`onError` で受ける。

### `Result` の道具

`apps/api-server/src/utils/result` が提供する。

| 関数            | 用途                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| `ok` / `err`    | 成功 / 失敗を構築する                                                  |
| `map`           | 成功値だけを変換する                                                   |
| `all`           | 複数フィールドをまとめて検証し、最初の失敗を返す（値の型は個別に保つ） |
| `traverse`      | 配列の各要素を検証し、最初の失敗を返す                                 |
| `unwrapOrThrow` | 「失敗しえない」前提の箇所で剥がす。破れたら例外（= 500）              |

---

## 全体像

4つの部品で構成する。

| 部品         | 位置                    | 責務                                                               |
| ------------ | ----------------------- | ------------------------------------------------------------------ |
| ① エラー定義 | 各レイヤーに co-located | `type + factory (+ 必要なら型ガード)` を定義                       |
| ② errorMap   | `apps/api-server/src/`  | エラー種別 → HTTPステータス / メッセージ のマッピング表            |
| ③ ルート     | 各 API ルート           | usecase の `Result` を判定し、`err` を `handleAppError` に渡す     |
| ④ onError    | Hono のルートエントリ   | 形式検証エラーと想定外の例外の最後の受け皿（業務エラーは通らない） |

### 処理フロー

```text
┌─────────────────────────────────────────────────────────────┐
│ クライアント                                                │
└────────┬────────────────────────────────────────────────────┘
         │ HTTP Request
         ▼
┌─────────────────────────────────────────────────────────────┐
│ ③ ルートハンドラ                                            │
│    認証 / zod バリデーション / usecase 呼び出し             │
│    result.ok を判定して handleAppError へ渡す               │
└────────┬────────────────────────────────────────────────────┘
         │ 呼び出し             ▲ Result<T, E>
         ▼                     │
┌─────────────────────────────────────────────────────────────┐
│ usecase / domain                                            │
│    ルール違反を検知したら ① のエラーを err で返す           │
└─────────────────────────────────────────────────────────────┘

         ② errorMap: error.type → status + message + details
         ▲
         │ handleAppError(result.error, c)     ← 業務エラーの経路
         │ onError(error, c)                   ← 形式検証 / 想定外の例外
```

業務エラーとシステム障害が **同じ変換表（errorMap）に、別の経路で** 入る。どちらも最終的に `handleAppError` が HTTP へ翻訳する。

---

## ① エラー定義（co-location）

エラーは **ルールを知っているレイヤー** に置く。「usecase 固有の前提違反」は usecase 配下、「ドメインの不変条件違反」はドメイン配下。配置の詳細は [layer-responsibilities.md](./layer-responsibilities.md) の「配置ルール」を参照。

### class 不使用の方針

プロジェクト全体の方針（Entity/VOはtype + ファクトリ関数）に揃え、**エラーもclassを使わず `type + ファクトリ関数` を基本セットで定義する**。

- **type**: `Error` を基底に、判別用の `type` フィールドと固有のコンテキスト情報を持つ型
- **ファクトリ関数**: `create{ErrorName}` 命名で `Error` インスタンスを生成し `Object.assign` でフィールドを付与
- **型ガード関数 (`isXxxError`)**: errorMap 側が `type` フィールドで判別するため **原則不要**。レイヤーをまたいで型で分岐したい場合やテストで判別したい場合のみ定義する

`Error` を基底に使うのはスタックトレース互換性のため（`Result` の `err` に載せる場合も、ログにスタックを残せる利点は変わらない）。判別は `instanceof` ではなく **`type` フィールド** で行う。

### 実装テンプレート

エラーは `err` に載せる値であり、自分では投げない。`{domain}/errors/{errorName}/` に型 + factory + 型ガードだけを置く。

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

判定は **ルールを持つ呼び出し元** が行い、`err` で返す。

```typescript
// domain/services/userRegistration/index.ts
if (userIfRegistered) return err(createUserAlreadyRegisteredError());
```

コンテキスト情報を型に載せたい場合（例: `accountId` を message に含めたい）は、該当フィールドを type に追加して factory が受け取る形にする。

```typescript
// domain/artists/errors/accountIdAlreadyTaken/index.ts（コンテキスト付きの例）
export type AccountIdAlreadyTakenError = Error & {
  readonly type: "AccountIdAlreadyTakenError";
  readonly accountId: string;
};

export const createAccountIdAlreadyTakenError = (
  accountId: string,
): AccountIdAlreadyTakenError =>
  createTypedError("AccountIdAlreadyTakenError", { accountId });
```

### Value Object のテンプレート

VO のファクトリは `Result<T, InvalidXFormatError>` を返す。

```typescript
// domain/users/valueObjects/email/index.ts
export const createEmail = (
  value: string,
): Result<Email, InvalidEmailFormatError> => {
  if (!isValidEmail(value)) {
    return err(createInvalidEmailFormatError());
  }
  return ok({ value });
};
```

### Entity ファクトリの 2 系統

同じ VO 群を組み立てるが、**入力の出所によって失敗の意味が変わる**ため関数を分ける。

| 関数                  | 入力の出所   | 戻り値              | 失敗の意味                        |
| --------------------- | ------------ | ------------------- | --------------------------------- |
| `create{Entity}`      | ユーザー入力 | `Result<Entity, E>` | 入力が不正 → 422 で返す           |
| `reconstruct{Entity}` | DB から復元  | `Entity`            | 保存値が壊れている → 500 に落とす |

`reconstruct` は内部で `unwrapOrThrow` を使う。ユーザー入力を `reconstruct` に渡すと、入力不正が 422 ではなく 500 になるので **絶対に混ぜない**。

```typescript
export const createUser = (
  params: CreateUserParams,
): Result<User, UserFieldError> =>
  map(buildState(crypto.randomUUID(), params), createUserBehaviors);

export const reconstructUser = (params: ReconstructUserParams): User =>
  unwrapOrThrow(
    map(buildState(params.id, params), createUserBehaviors),
    "reconstructUser: stored user has invalid field values",
  );
```

### co-location の原則

- エラー型とその factory / 型ガードは同じディレクトリに置く。ディレクトリ名はエラーの名前に揃える（`errors/userNotFound/`）
- ルール判定そのものは、そのルールを知っているモジュール（VO / service / usecase）が持ち、`err` で返す
- HTTP のことを知ってはいけない（status コードはここには書かない）
- 共通基底（`UseCaseError` 等）は現時点では作らない

---

## ② errorMap

全エラーを `type` をキーとしたテーブルで一元管理する。HTTP への変換表であり、**ドメインや usecase から import されてはいけない**（方向: errorMap → 各レイヤー）。

### 配置

```text
apps/api-server/src/errorMap/
├── index.ts
└── index.test.ts
```

### 実装テンプレート

```typescript
// apps/api-server/src/errorMap/index.ts
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { UserAlreadyRegisteredError } from "../domain/users/errors/userAlreadyRegistered";
import type { AccountIdAlreadyTakenError } from "../domain/artists/errors/accountIdAlreadyTaken";

export type AppError = UserAlreadyRegisteredError | AccountIdAlreadyTakenError;

type ErrorMapping<SpecificError extends AppError> = {
  status: ContentfulStatusCode;
  message: (error: SpecificError) => string;
  // 任意: zod issues 等の構造化コンテキストを返したい場合に実装する
  details?: (error: SpecificError) => unknown;
};

type ErrorMap = {
  [ErrorType in AppError["type"]]: ErrorMapping<
    Extract<AppError, { type: ErrorType }>
  >;
};

const errorMap: ErrorMap = {
  UserAlreadyRegisteredError: {
    status: 409,
    message: () => "User already registered",
  },
  AccountIdAlreadyTakenError: {
    status: 409,
    message: (error) => `Account ID already taken: ${error.accountId}`,
  },
};

const isAppError = (error: unknown): error is AppError => {
  if (!(error instanceof Error)) return false;
  const type = (error as { type?: unknown }).type;
  return typeof type === "string" && type in errorMap;
};

const buildMappedResponse = <Error extends AppError>(
  error: Error,
): ErrorResponse => {
  const mapping = errorMap[error.type as Error["type"]] as ErrorMapping<Error>;
  const body: ErrorResponse["body"] = { error: mapping.message(error) };
  if (mapping.details) {
    body.details = mapping.details(error);
  }
  return { body, status: mapping.status };
};

type ErrorResponse = {
  body: { error: string; details?: unknown };
  status: ContentfulStatusCode;
};

// 内部ヘルパ: 外部からは handleAppError 経由でのみ使う
const resolveErrorResponse = (error: unknown): ErrorResponse => {
  if (isAppError(error)) {
    const response = buildMappedResponse(error);
    console.warn("[AppError]", {
      type: error.type,
      status: response.status,
      message: error.message,
    });
    return response;
  }
  console.error("[Unhandled error]", error);
  return {
    body: { error: "Internal Server Error" },
    status: 500,
  };
};

// 公開面: ルートから result.error を渡す / Hono の onError にそのまま渡す
export const handleAppError = (error: Error, c: Context) => {
  const { body, status } = resolveErrorResponse(error);
  return c.json(body, status);
};
```

### 設計ポイント

- `AppError` は union 型。**新しいエラーを追加したら union に足す → errorMap のキー補完が効く** ので、マッピングの漏れを型で防げる
- `message` を関数にしておくと、エラーのコンテキスト情報（`accountId` 等）をメッセージに差し込める
- `details?` を任意で実装すると、レスポンス body に構造化コンテキスト（zod issues 等）を含められる
- クライアントに返すメッセージと、内部ログに残す `error.message` は別物でよい（errorMap 側は UI 用に整形）
- 公開 API は `handleAppError` のみ。`resolveErrorResponse` は実装詳細として閉じる
- **業務エラーもシステム障害も同じ変換表を通る**。違うのは入り口（ルートから直接渡すか、onError が拾うか）だけ

---

## ③ ルートハンドラ

usecase の `Result` を判定し、`err` なら `handleAppError` に渡す。`try/catch` は書かない。

```typescript
const result = await updateMyAccountIdUseCase(input, deps);

if (!result.ok) {
  return handleAppError(result.error, c);
}

return c.json(result.value);
```

`result.ok` の判定を書かないとコンパイルが通らないため、**エラー処理の書き忘れが型で防がれる**。これが `throw` + `onError` だけの構成には無い保証。

zod バリデーションエラーは `validateRequest` ファクトリ経由で `onError` に流すので、ハンドラ内に 400 のレスポンス組み立ては書かない。

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
import { handleAppError } from "../../../../../errorMap";

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
    const auth0User = c.get("auth0User");

    const result = await createUserUseCase(
      { subId: auth0User.sub, email: body.email, accountId: body.accountId },
      getContainer(),
    );

    if (!result.ok) {
      return handleAppError(result.error, c);
    }

    return c.json(result.value, 201);
  },
);

export default app;
```

各 zod ルールに渡したメッセージは、レスポンス `details[].message` にそのまま乗るのでクライアントのフォーム inline 表示に使える。

---

## ④ onError ハンドラ

`onError` は **業務エラーの経路ではない**。形式検証エラー（`InvalidRequestFormatError`）と、想定外の例外（`reconstruct` の破綻・DB 障害）の最後の受け皿として置く。

```typescript
// app/api/[[...route]]/route.ts
const app = new Hono()
  .basePath("/api")
  .route("/users", usersRoute)
  // ... 他ルート
  .onError(handleAppError);
```

### 注意点

- **zod バリデーションエラー** は `zValidator` の第3引数フックで `throw` する。ミドルウェア層は戻り値を持てないため `Result` にできず、`onError → handleAppError → errorMap` で 400 + `details` に変換する
- **認証ミドルウェアのエラー** はミドルウェア内で直接 401 を返す
- **Infrastructure 層の技術的例外**（DB接続失敗等）は `isAppError` にマッチせず 500 に落ちる。これで正しい（500 はまさに "依存先の契約違反" の表現）
- **業務エラーが onError に到達したら設計の破れ**。`Result` にすべき失敗が `throw` されている可能性を疑う

---

## 新しいエラーを追加する手順

```text
1. エラーを検知するレイヤーを決める（domain / usecase）
2. {domain}/errors/{errorName}/ に type + factory (+ 型ガード) を定義
3. 検知する関数の戻り値を Result<T, E> にし、E の union に型を足す
4. errorMap/index.ts の AppError union に型を追加
   → TypeScriptが errorMap の未実装キーを指摘する
5. errorMap に status と message を実装
6. 検知箇所で err(createXxxError()) を返す
```

ルートハンドラは `result.ok` の判定を既に持っているため **触らない**。onError も不変。

---

## 設計上の利点

- **失敗が型に現れる**: usecase のシグネチャを見れば失敗しうるエラーが分かる。`result.ok` の判定漏れはコンパイルエラー
- **追加コスト最小**: 新エラーは「co-located 定義 + エラー union に1行 + errorMap に1行」だけ。ルート / onError は不変
- **型で網羅性を強制**: AppError union に追加すれば errorMap のキーは型で補完される → マッピング漏れをコンパイル時に検知
- **レイヤーの独立性維持**: ドメイン / usecase は HTTP を知らない。errorMap だけが橋渡しをする
- **テスト容易性**: usecase のテストは「適切なエラーを `err` で返すか」を戻り値で検証すればよい（`rejects` を挟まない）。HTTP 変換は errorMap のユニットテストで独立に検証可能
- **業務エラーと障害の分離**: 500 に落ちるのは本当に想定外の事象だけになり、ログ・アラートの信号品質が上がる
