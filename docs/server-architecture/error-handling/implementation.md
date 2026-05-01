# エラーハンドリング実装パターン

[layer-responsibilities.md](./layer-responsibilities.md) で定めた責務分離を、コードレベルでどう実現するかを定める。

本ドキュメントのスコープ:

- エラーをどう書くか（`type` + factory + assert）
- HTTPレスポンスへの変換をどう共通化するか（`errorMap`）
- ルートハンドラに何を書かない / 書くか（`onError`）
- 新しいエラーを追加する手順

設計思想は [concepts.md](./concepts.md)、運用への接続（ログ基盤・SLO）は [operations.md](./operations.md) を参照。

---

## 全体像

4つの部品で構成する。

| 部品         | 位置                    | 責務                                                     |
| ------------ | ----------------------- | -------------------------------------------------------- |
| ① エラー定義 | 各レイヤーに co-located | `type + factory + (必要なら) assert関数` を定義          |
| ② errorMap   | `apps/api-server/src/`  | エラー種別 → HTTPステータス / メッセージ のマッピング表  |
| ③ onError    | Hono のルートエントリ   | 投げられたエラーを errorMap に引き当ててレスポンス化する |
| ④ ルート     | 各 API ルート           | try/catch せずに throw させる（onError が受け取る）      |

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
│    error.type を見て ② errorMap を引く                      │
│    → status + message を組み立てて JSON レスポンス          │
│    未知のエラーは 500                                       │
└─────────────────────────────────────────────────────────────┘
```

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
      "User already registered"
    ) as UserAlreadyRegisteredError;
    return Object.assign(error, {
      type: "UserAlreadyRegisteredError" as const,
    });
  };

export const assertNotRegistered = (userIfRegistered: User | null): void => {
  if (userIfRegistered) throw createUserAlreadyRegisteredError();
};
```

コンテキスト情報を型に載せたい場合（例: `accountId` を message に含めたい）は、該当フィールドを type に追加して factory が受け取る形にする。

```typescript
// domain/artists/errors.ts（コンテキスト付きの例）
export type AccountIdAlreadyTakenError = Error & {
  readonly type: "AccountIdAlreadyTakenError";
  readonly accountId: string;
};

export const createAccountIdAlreadyTakenError = (
  accountId: string
): AccountIdAlreadyTakenError => {
  const error = new Error(
    `Account ID already taken: ${accountId}`
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
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { UserAlreadyRegisteredError } from "../domain/users/policies/assertNotRegistered";
import type { AccountIdAlreadyTakenError } from "../domain/artists/errors";

export type AppError = UserAlreadyRegisteredError | AccountIdAlreadyTakenError;

type ErrorMapping<SpecificError extends AppError> = {
  status: ContentfulStatusCode;
  message: (error: SpecificError) => string;
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
  error: Error
): ErrorResponse => {
  const mapping = errorMap[error.type as Error["type"]] as ErrorMapping<Error>;
  return {
    body: { error: mapping.message(error) },
    status: mapping.status,
  };
};

export type ErrorResponse = {
  body: { error: string };
  status: ContentfulStatusCode;
};

export const resolveErrorResponse = (error: unknown): ErrorResponse => {
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
```

### 設計ポイント

- `AppError` は union 型。**新しいエラーを追加したら union に足す → errorMap のキー補完が効く** ので、マッピングの漏れを型で防げる
- `message` を関数にしておくと、エラーのコンテキスト情報（`accountId` 等）をメッセージに差し込める
- クライアントに返すメッセージと、内部ログに残す `error.message` は別物でよい（errorMap 側は UI 用に整形）

---

## ③ onError ハンドラ

Hono の `onError` で一元的に捕捉し、`resolveErrorResponse` へ委譲する。ルートハンドラでは `try/catch` を書かず、onError 側も HTTP 変換の詳細を持たない（詳細は `errorMap` 側に閉じる）。

```typescript
// app/api/[[...route]]/route.ts
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { resolveErrorResponse } from "../../../errorMap";

const app = new Hono()
  .basePath("/api")
  .route("/users", usersRoute)
  // ... 他ルート
  .onError((error, c) => {
    const { body, status } = resolveErrorResponse(error);
    return c.json(body, status);
  });

export const GET = handle(app);
export const POST = handle(app);
```

### 注意点

- **zod バリデーションエラー** は `zValidator` の第3引数で 400 を返すので、onError まで届かない
- **認証ミドルウェアのエラー** は onError で扱うか、ミドルウェア内で直接 401 を返すかはプロジェクトで決める（本設計では「ミドルウェアは直接返す、usecase以降は throw で onError」を推奨）
- **Infrastructure 層の技術的例外**（DB接続失敗等）は `isAppError` にマッチせず 500 に落ちる。これで正しい（500 はまさに "依存先の契約違反" の表現）

---

## ④ ルートハンドラ

エラーを try/catch しない。usecase を呼んで結果を返すだけ。

```typescript
// app/api/[[...route]]/users/create/index.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createUserUseCase } from "...";

const requestSchema = z.object({
  email: z.string().min(1),
  accountId: z.string().min(1),
});

const app = new Hono().post(
  "/",
  zValidator("json", requestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: "Invalid request", issues: result.error.issues },
        400
      );
    }
  }),
  async (c) => {
    const body = c.req.valid("json");
    const session = await auth0.getSession();
    if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

    // try/catch 不要。AppError は onError が、未知のエラーも onError が拾う
    const result = await createUserUseCase(
      { subId: session.user.sub, email: body.email, accountId: body.accountId },
      getContainer()
    );

    return c.json({ userId: result.userId, artistId: result.artistId }, 201);
  }
);

export default app;
```

---

## 新しいエラーを追加する手順

```text
1. エラーを投げるレイヤーを決める（domain / usecase）
2. 該当ディレクトリに co-located で type + factory (+ assert関数) を定義
3. errorMap/index.ts の AppError union に型を追加
   → TypeScriptが errorMap の未実装キーを指摘する
4. errorMap に status と message を実装
5. usecase / policy から throw する
```

ルートハンドラも onError も **触らない**。これが本設計の最大のメリット。

---

## 設計上の利点

- **追加コスト最小**: 新エラーは「co-located 定義 + errorMap に1行」だけ。ルート / onError は不変
- **型で網羅性を強制**: AppError union に追加すれば errorMap のキーは型で補完される → マッピング漏れをコンパイル時に検知
- **レイヤーの独立性維持**: ドメイン / usecase は HTTP を知らない。errorMap だけが橋渡しをする
- **テスト容易性**: usecase のテストは「適切なエラーを throw するか」だけを検証すればよい。HTTP 変換は errorMap のユニットテストで独立に検証可能
