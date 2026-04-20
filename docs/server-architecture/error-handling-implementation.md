# エラーハンドリング実装設計

`error-handling.md` の設計方針（レイヤー別責務・co-locatedなエラー定義）を前提に、**実装パターン** を定める。

本ドキュメントのスコープ:

- エラーをどこに書くか（配置）
- HTTPレスポンスへの変換をどう共通化するか
- ルートハンドラに何を書かない / 書くか

設計思想・なぜ層を分けるか等は `error-handling.md` を参照。

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

エラーは **ルールを知っているレイヤー** に置く。「usecase 固有の前提違反」は usecase 配下、「ドメインの不変条件違反」はドメイン配下。

### 配置ルール

ルール判定そのもの（`assertXxx` / `ensureXxx`）とエラー型をセットで `policies/` 配下にまとめる。再利用しない純粋に1ユースケース固有のエラーは `usecases/.../errors.ts` に置く。

```text
domain/users/policies/assertNotRegistered/
├── index.ts          # type / factory / assert関数
└── index.test.ts

domain/artists/
└── errors.ts         # インフラ層などから直接 throw されるドメインエラー（assert関数を持たない）

usecases/users/createUser/
├── index.ts
├── index.test.ts
└── errors.ts         # このusecase専用のエラーのみここに
```

配置の分岐:

- **`policies/{assertXxx}/`** — ルール判定関数（`assertXxx` / `ensureXxx`）とそのエラーをセットで置く。ドメイン層の業務ルール違反を表すのが主用途
- **`{domain}/errors.ts`** — assert関数を挟まず、リポジトリやインフラ層から直接 throw するドメインエラー。DBの一意制約違反をドメインエラーに変換する等
- **`usecases/{usecase}/errors.ts`** — そのユースケース専用で他から再利用しないエラー

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
- 型ガード関数 (`isXxxError`) は **errorMap 側が `type` フィールドで判別するため原則不要**。レイヤーをまたいで型で分岐したい場合のみ定義する

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

## レイヤー別に扱うエラーの分類

| レイヤー         | 扱うエラー例                                 | errorMap 登録     | HTTP status |
| ---------------- | -------------------------------------------- | ----------------- | ----------- |
| Value Object     | `InvalidEmailFormatError` 等の値不正         | ○                 | 400 / 422   |
| Entity           | 不変条件違反                                 | ○                 | 422         |
| Usecase          | 前提条件違反（未登録 / 既に存在 / 対象なし） | ○                 | 404 / 409   |
| Infrastructure   | DB接続失敗・外部APIタイムアウト              | ×（500化）        | 500         |
| Zod (エントリ層) | リクエスト形式不正                           | ×（handler内）    | 400         |
| 認証ミドルウェア | 未認証                                       | ×（middleware内） | 401         |

- errorMap に登録するのは **クライアントに意味のあるフィードバックを返すべきエラー** のみ
- Infrastructure 層のエラーを errorMap に足すと、内部事情（「DBが応答しません」）が漏れる。500 + ログが正解

---

## 既存の error-handling.md との関係

| ドキュメント                               | 扱う内容                                              |
| ------------------------------------------ | ----------------------------------------------------- |
| `error-handling.md`                        | メンタルモデル・レイヤー責務・なぜこう分けるか（Why） |
| `error-handling-implementation.md`（本書） | 実装パターン・ファイル配置・追加手順（How）           |

両者は補完関係。思想で迷ったら前者、コードで迷ったら本書を参照。

---

## 設計上の利点

- **追加コスト最小**: 新エラーは「co-located 定義 + errorMap に1行」だけ。ルート / onError は不変
- **型で網羅性を強制**: AppError union に追加すれば errorMap のキーは型で補完される → マッピング漏れをコンパイル時に検知
- **レイヤーの独立性維持**: ドメイン / usecase は HTTP を知らない。errorMap だけが橋渡しをする
- **テスト容易性**: usecase のテストは「適切なエラーを throw するか」だけを検証すればよい。HTTP 変換は errorMap のユニットテストで独立に検証可能

---

## 今後の必要な対応（ログ基盤・監視連携）

現状は「クライアントに返すエラーレスポンス」の設計が完了した段階。次に必要なのは **内部ログ基盤の整備と監視サービス（Datadog 等）との連携** であり、これを後づけしやすい構造になっているかを整理する。

### 現状の拡張性評価

現状のエラーは全て `resolveErrorResponse` を通過するため、**ログ出力点が1箇所に集中している**。これが拡張の最大のメリット。

| 観点                                       | 現状                                    | 監視基盤への適合度 |
| ------------------------------------------ | --------------------------------------- | ------------------ |
| ログ出力点の集約                           | ✅ `resolveErrorResponse` の 2 箇所     | ◎                  |
| 構造化フォーマット                         | ✅ JSON オブジェクト                     | ◎                  |
| エラー種別の識別可能性                     | ✅ `type` フィールド                    | ◎                  |
| ドメインコンテキスト（accountId 等）の保持 | ✅ `extras` で型付き保持                | ◎                  |
| 重要度分岐                                 | △ `console.warn` / `console.error` のみ | ○（要強化）        |
| リクエスト相関（trace_id, request_id）     | ❌ 未実装                               | ✗（要追加）        |
| サービスメタデータ（env, service, version） | ❌ 未実装                               | ✗（要追加）        |
| センシティブ情報のマスク                   | ❌ 未実装                               | △                  |
| ログ出力先の差し替え                       | ❌ `console.*` 直書き                   | ✗（要 interface 化） |

「基礎は良い、足りないのは周辺装備」という評価。周辺装備は本体の構造を変えずに追加できる。

### レベル1: Logger interface を挟む（最小侵襲）

`console.warn` / `console.error` を Logger interface 経由に置き換え、実装を環境で差し替えられるようにする。

```typescript
// utils/logger/index.ts（将来追加）
export interface Logger {
  warn(event: string, fields: Record<string, unknown>): void;
  error(event: string, fields: Record<string, unknown>): void;
}
```

- 開発環境: console ベース
- 本番環境: pino / winston / Datadog SDK などへ差し替え

変更箇所は `resolveErrorResponse` 内の 2 行だけ。

### レベル2: errorMap にログ制御を追加する（必要になったら）

per-error で log level や追加フィールドを宣言できるよう errorMap を拡張:

```typescript
AccountIdAlreadyTakenError: {
  status: 409,
  message: (error) => `Account ID already taken: ${error.accountId}`,
  logLevel: "info",                                    // 高頻度 4xx は info 降格
  logFields: (error) => ({ accountId: error.accountId }), // Datadog の custom attribute
},
```

**今は実装しない**。既存エントリは後方互換のまま、必要になったタイミングで型を拡張すれば追加可能。

### レベル3: リクエストコンテキストの注入

監視基盤と連携するために必須になる情報:

- `trace_id` / `span_id`（分散トレースとの相関）
- `request_id` / `user_id`（リクエスト単位での絞り込み）
- `route`（どのエンドポイントで起きたか）
- `env` / `service` / `version`

Node.js の `AsyncLocalStorage` で request-scoped なコンテキストを保持し、`resolveErrorResponse` から拾って Logger に渡す構成が標準的。

```typescript
// middlewares/requestContext.ts（将来追加）
// リクエスト開始時に AsyncLocalStorage.enterWith({ traceId, userId, route })

// resolveErrorResponse 内で
logger.warn("[AppError]", {
  ...getRequestContext(),   // traceId, userId, route 等
  type: error.type,
  status: response.status,
  ...extractExtras(error),  // 構造化コンテキスト
});
```

この拡張も **エラーハンドリング本体には手を入れずに** 追加できる。

### レベル4: Datadog / 監視基盤アダプタ

Logger interface さえあれば、実装を差し替えるだけ。

```typescript
// infrastructure/logger/datadog.ts（将来追加）
import pino from "pino";

export const createDatadogLogger = (): Logger => {
  const pinoLogger = pino({
    /* Datadog 互換の JSON 設定 */
  });
  return {
    warn: (event, fields) => pinoLogger.warn({ event, ...fields }),
    error: (event, fields) => pinoLogger.error({ event, ...fields }),
  };
};
```

`resolveErrorResponse` / errorMap / factory は変更ゼロ。

### 拡張しても失われない性質

ログ基盤を積み上げても、**新エラーの追加コストは増えない**:

```text
1. co-located で typed error を定義（1ファイル）
2. errorMap に 1行追加（status + message）
3. （必要なら）logFields を追加
4. テスト追加
```

`resolveErrorResponse` / Logger / onError / ルート は一切触らない、という性質は保たれる。

### ロードマップまとめ

| フェーズ | タスク                                               | 影響範囲                                |
| -------- | ---------------------------------------------------- | --------------------------------------- |
| 現在     | クライアント向けレスポンス設計                       | 完了                                    |
| 次       | Logger interface を新設し console 呼び出しを置換     | `resolveErrorResponse` の 2 行          |
| その次   | リクエストコンテキスト（trace_id 等）を注入する基盤   | middleware 1 本 + Logger 呼び出しの拡張 |
| その次   | 必要なら errorMap に logLevel / logFields を追加     | 型の拡張（後方互換）                    |
| その次   | Datadog / 監視基盤アダプタの実装                     | Logger interface の実装 1 本            |

順序は前から後ろに積むだけで済む構造になっている。逆順でも欠けた層を飛ばす形でもなく、**下から順に積み上げる** のが自然な進め方。

---

## 最終的な接続先: SLO / SRE 運用の土台

本設計の意義は「クライアントに綺麗なエラーレスポンスを返す」だけではない。最終的に **SLO / SLA を運用可能にするための基礎インフラ** として機能する。

### 因果の全体像

```text
[エラーを型で定義し、発生レイヤーで区別する]
         ↓
[構造化ログに errorType / layer / context が乗る]
         ↓
[Datadog 等で次元別に集計・アラートできる]
         ↓
[「何を失敗としてカウントするか」が設計時に決められる]
         ↓
[SLO / SLI / エラーバジェットが意味のある数値になる]
         ↓
[SLA として顧客・社内に約束できる]
```

**各段階は一つ前が整っていないと機能しない**。SLO を先に決めようとしてもエラー型が区別されていなければ数字が意味を持たない。この設計は **逆算して下流から積み上げている** 状態にある。

### エラー設計が SLO 運用で必須になる理由

SLO 運用の核心は「**カウントすべき失敗とカウントすべきでない失敗を区別する**」こと。型付きエラーがないとこの区別が実現できない。

| エラー                              | HTTP | SLO 上の扱い                | 理由                                   |
| ----------------------------------- | ---- | --------------------------- | -------------------------------------- |
| `UserAlreadyRegisteredError`        | 409  | カウントしない              | 業務上の正常拒否。サービス側の失敗ではない |
| `InvalidEmailFormatError`           | 422  | カウントしない              | ユーザー入力起因。API は正しく動作している |
| 未知のエラー（Unhandled）          | 500  | カウントする                | サーバ側の契約違反。可用性を毀損する    |
| DB タイムアウト                     | 500  | カウントする                | 依存先の契約違反                       |

全部 500 で返す設計だと「カウントしない」行の判定が不可能になり、**SLO が毎日壊れる状態** になる。結果として:

- アラート疲労（本当の障害が埋もれる）
- エラーバジェットが形骸化
- SLA を顧客に約束できない

### 本設計が SLO 運用を支える4つの要素

#### 1. `type` フィールドによる次元化

Datadog 等で `errorType` で絞り込み・集計・アラート条件設定ができる。

```text
errorType:UserAlreadyRegisteredError → 警告不要（業務上の正常失敗）
errorType:* AND status:500            → PagerDuty 発火条件
```

#### 2. エラーの発生レイヤー分類

同じ HTTP ステータスでも「ドメイン層から来たのか、Infrastructure 層から来たのか」で意味が違う。レイヤー別にエラー型を定義している設計なら、ログから起因層を即座に特定できる。

#### 3. HTTP ステータスへの一元マッピング

`errorMap` が唯一の翻訳係なので、「体験として失敗とみなす範囲」を一箇所で定義できる。

- 409（業務上の拒否）: ユーザーは次のアクションに進める → 体験 OK
- 500（予期せぬ失敗）: ユーザーは詰まる → 体験 NG

この境界の変更が1ファイルで完結するため、SLO 定義の見直しにも耐える。

#### 4. 構造化コンテキストによる影響範囲特定

SLO が悪化したとき、「どの顧客セグメント / どのテナントで起きているか」を特定する必要がある。`extras` に `accountId` / `tenantId` 等のドメイン語彙が型付きで乗っていれば、Datadog で次元別にグルーピングして影響範囲を即座に可視化できる。

### 接続に必要な補足整備（別途必要）

エラー設計から SLO 運用に到達するには、以下は **別途整備が必要** で、本設計の範囲外:

- **リクエスト全体のメトリクス**: 成功リクエスト数・失敗リクエスト数の総量（SLI の分母）
- **サンプリング・レート計測**: 高トラフィック時のコスト管理
- **デプロイマーカー**: エラー急増がデプロイ起因か判定するため
- **エラーバジェット消費率の可視化ダッシュボード**
- **アラートポリシー**: どの条件で誰に通知するか

本設計はこれらの **前提条件** を提供する立場にある。型付きエラーという土台があるからこそ、これらの運用プラクティスが意味を持つ。

### まとめ

本ドキュメントで扱っている設計は、表面的には「エラーレスポンスの返し方」だが、実質的には **SLO / SRE 運用の前提条件を整える作業**。

> 握りつぶされたエラーは SLO を壊す。型付きエラーは SLO を可能にする。

この視点を持って設計に取り組めば、「なぜここまで細かく分類するのか」「なぜ HTTP status を一元化するのか」の答えが、単なる「コードの綺麗さ」ではなく「運用可能性」であることが明確になる。
