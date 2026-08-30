# BFF（Backend For Frontend）設計

> **位置づけ**
> BFF は **フロントエンド（`apps/beatfolio`）が api-server と対話するための仲介層**であり、フロントエンドアーキテクチャの一部である。
> api-server 側の内部設計（ドメイン / usecase / repository 等）とは責務が分かれる。サーバー内部設計は [`docs/server-architecture/`](../../server/architecture.md) を参照。
> 認証・セッション観点での BFF の役割は [`authentication.md`](../../authentication.md) を参照。本ドキュメントは **データフローの設計基盤**を担う。
> Web / iOS 等のマルチクライアント化で BFF がどう発展するかは [`bff-multi-client.md`](./multi-client.md) を参照。

---

## 第1部: ストラテジー（設計思想）

### BFF の責務

BFF の責務は **特定の画面に対して、その画面が必要とするデータを返すための中間層**である。
api-server との仲介を通じて、**バックエンド観点とフロントエンド観点の差を吸収し、UI を UI に専念させる**ことを目的とする。

```
ブラウザ / SSR  ──▶  BFF（画面に必要な形へ変換する中間層）──▶  api-server
                       ・画面単位でデータを揃える
                       ・不要なデータをそぎ落とす
                       ・観点の差を吸収する
```

- **画面単位で考える** — BFF はリソース単位ではなく「画面が何を必要とするか」を起点にデータを返す。read route も `getMe`（リソース名）ではなく `getDashboard`（画面名）のように画面に紐づけて設計する。
- **そぎ落とす** — api-server はドメインとして正しい完全なデータを返す。その画面に不要なフィールド・リレーションは BFF で削る。UI に「使わないデータ」を渡さない（[`.claude/rules/code-review-checklist.md`](../../) の「不要なデータの過剰取得防止」「インターフェース設計の簡潔さ」と整合）。
- **観点を緩和する** — バックエンドは「ドメイン的に正しい単位・完全な形」で考え、フロントエンドは「画面に必要な最小限の形」で考える。両者の観点は本来ズレる。このズレ（インピーダンスミスマッチ）を BFF が吸収することで、**api-server は画面都合に縛られず**、**UI は受け取った形をそのまま表示することに専念できる**。

> BFF は「バックエンドとフロントエンドのどちらの都合も持ち込ませない緩衝地帯」。
> ここで画面都合の変換を完結させることで、api-server はドメインに、UI は表示に、それぞれ専念できる。

### 厚みの非対称: read は厚く、write は薄い

read も write も **BFF route（`/api/*`）を経由する**。経路は対称だが、route 内の「厚み」は取得系と更新/削除系で**非対称**にする。

| 種別                     | BFF route の振る舞い                                                                    | 厚み                   |
| ------------------------ | --------------------------------------------------------------------------------------- | ---------------------- |
| **取得系（read）**       | api-server を呼び出し、**画面に必要な構造へ変換**して返す（集約・整形・**そぎ落とし**） | **厚い**               |
| **更新/削除系（write）** | 画面から必要なデータを受け取り、api-server へ**送信するだけ**                           | **薄い**（パススルー） |

- **read route** は「画面が必要とする形」を組み立てる場所。役割は3つ:
  - **集約** — 複数 api-server 呼び出しを1つの画面用構造にまとめる
  - **整形** — 画面が扱いやすい形（命名・ネスト）に変換する
  - **そぎ落とし** — その画面に不要なフィールド・リレーションを削り、UI に使わないデータを渡さない
- **write route** は素通し。バリデーション（後述）を除き、ビジネスロジックや整形を持たない。

### 表示語彙の解決は BFF が担う（マスタ参照モデル）

画面に出すドメイン語彙（種別ラベル・選択肢・アイコン等）は **DB マスタを出所**とし、その **`code → label / icon` の解決を BFF が行う**。UI には解決済みの表示用データだけを渡し、フロントに語彙を持たせない。

- api-server は「種別一覧」などの **汎用 API** を返す（画面都合を持たない）。BFF がそれを画面用に整形し、利用層が持つ `code` / FK を表示用の `label` / `icon` へ解決する。
- 選択肢（ウィザードのドロップダウン等）も BFF を経由して供給する。`packages/ui` 側に固定リストを持たない（[`component-design.md`](../ui/component-design.md)「表示語彙は DB 由来・props で受け取る」）。
- 「UI に `code` だけ渡してフロントでラベル変換」は語彙のハードコードに当たり禁止。これは read route の「整形」の一部として BFF で完結させる。
- 出所と責務分担の全体像（DB → api-server → BFF → UI）は [`../../server/database/design.md`](../../server/database/design.md) §7 を参照（canonical）。

### read も write も BFF route を経由する（対称な経路）

> **read も write も同じ `/api/*` の BFF route を通る。route が「api-server 仲介・画面都合の変換」を一手に担い、UI（`page.tsx` を含む）は route が返した形をそのまま使う。**

| 種別      | 起点                             | 経路                                        | route の責務      |
| --------- | -------------------------------- | ------------------------------------------- | ----------------- |
| **read**  | **SSR**（`page.tsx` の初期描画） | `page.tsx` ─HTTP─▶ `/api/*` ─▶ api-server | 呼び出し + 整形   |
| **write** | **CSR**（ブラウザの hook）       | hook ─HTTP─▶ `/api/*` ─▶ api-server       | 検証 + パススルー |

- **`page.tsx` は「初期レンダリングの器」**。認証・`redirect`・描画に専念し、**データの呼び出しと整形は BFF route に委ねる**。`page.tsx` に fetch + 整形ロジックを散らさない。
- **read は SSR から自分の `/api/*` を呼ぶため、自己 HTTP hop が発生する**。これは「整形責務を route に集約し、read/write の経路を対称に保つ」ための明示的なトレードオフとして受け入れる。

### なぜこの設計を採用するのか

1. **整形責務を route の一箇所に集約する**
   画面都合の変換（集約・整形・そぎ落とし）を **BFF route に閉じ込める**ことで、**api-server は「ドメインとして正しい単位」でリソースを返すこと**に、**`page.tsx`/UI は「route が返した形をそのまま表示すること」**に、それぞれ専念できる。`page.tsx` に取得・整形が散らばらず、画面の都合が api-server のレスポンス設計を侵食しない。

2. **read/write の経路が対称で、置き場所が一意に決まる**
   「read も write も `/api/*` の route」と固定することで、データフローのどの部分がどこにあるかが一意に分かる。read だけ別経路（`page.tsx` 直呼び）という非対称を持ち込まない。

3. **write はブラウザ起点なので HTTP 境界が必要**
   更新/削除はユーザー操作（CSR）から発火する。ブラウザから api-server へ到達する経路として HTTP エンドポイント（`/api/*`）が必要であり、ここで認証 cookie の付与・入力バリデーションを行う。read も同じ HTTP 境界に揃える。

4. **マルチクライアント化・SSR 喪失に強い**
   read が最初から HTTP route 経由なので、将来 BFF を standalone サービスへ切り出す際も**経路を変えずに済む**（`page.tsx` 直呼びだと read だけ HTTP 化の書き換えが要る）。詳細は [`bff-multi-client.md`](./multi-client.md)。

5. **コスト（自己 HTTP hop）は受容する**
   SSR から同一プロセスの `/api/*` を叩くシリアライズ + 往復のコストはあるが、**整形責務の集約・経路の対称・移植性**を優先して受け入れる。

---

## 第2部: 具体的な実装設計

> **実装方針: read も write も BFF route（`/api/*`）に集約する**
> read・write の両方を `/api/*` の BFF route が担う。route が api-server を呼び出し、read は整形して、write はパススルーして返す。
> `page.tsx` はその read route を呼んで初期レンダリングするだけにし、取得・整形ロジックを `page.tsx` に持たせない。

### route の実装規約は api-server と共有する

BFF も api-server と同じ Hono で実装するため、**「Hono の使い方」は api-server の規範をそのまま適用する**。URL の意味（何を 1 つの route にするか）だけが BFF 固有で、read は画面単位・write はセッション主体（`me`）で切る（前述）。

| 観点               | 規範（api-server と共通）                                                                                                                  | 出典                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| ルート合成         | 境界の `index.ts` がマウントテーブル。ディレクトリを掘るのは**リソースの境目とミドルウェアが変わる境目だけ**。URL セグメントごとに掘らない | [`architecture.md`「ルーティングは階層ごとに合成する」](../../server/architecture.md) |
| ユニット命名       | `{操作名}/index.ts`（`getDashboard/` `updateMyAccountId/`）。HTTP メソッド名のディレクトリ（`get/` `post/`）は使わない                     | [`api-design-guidelines.md`「ファイル構成」](../../server/api-design-guidelines.md)   |
| リクエスト検証     | `validators/validateRequest` が型付きエラーを throw。route 内で 400 を組み立てない                                                         | 同上                                                                                  |
| エラー定義の置き場 | エントリポイント固有のエラーは `[[...route]]/errors/{errorName}/`                                                                          | [`error-handling/implementation.md`](../../server/error-handling/implementation.md)   |
| HTTP への翻訳      | `errorMap` + `route.ts` の `.onError` で一括。route はステータスを書かない                                                                 | [エラー契約](#エラー契約)                                                             |

BFF に usecase / domain 層は作らない。route 横断の小さな helper（`shared/`）で足りる。

### 全体データフロー

```
取得（read）─ SSR
  page.tsx ──▶ fetchers ──HTTP──▶ /api/*（BFF read ルート）──▶ api-server
                                    requestContext で cookie 付き apiClient
                                    呼び出し + 整形（集約・整形・そぎ落とし）
                                                           │
                        Result 化した整形済みデータ ◀───────┘
  page.tsx は整形済みデータで業務判断（redirect）し、初期レンダリング
  （編集可能な部分だけ colocated な ClientAdapter に必要な値を渡す）

更新/削除（write）─ CSR
  ClientAdapter ──▶ hook（useXxx）──▶ fetchers ──▶ /api/*（BFF write ルート）
                                                        │
                                       zValidator で検証 │
                                                        ▼
                                  c.get("apiClient") ──▶ api-server へ送信
```

### read の実装: BFF read ルート（`/api/*`）＋ `page.tsx` から呼ぶ

read は **画面名で切った BFF read route** が api-server を呼び、画面に必要な形へ整形して返す。`page.tsx` はその route を呼んで **認証 → 業務判断（redirect）→ 初期レンダリング**に専念する（[`component-design.md`](../ui/component-design.md) のエントリポイント層責務に準拠）。

route は**リソース名ではなく画面名**で設計する（`me` ではなく `dashboard`）。

```ts
// src/app/api/[[...route]]/dashboard/getDashboard/index.ts  ← 画面名（getMe ではなく getDashboard）
const app = new Hono<RequestContextEnv>().get("/", async (c) => {
  const apiClient = c.get("apiClient");

  const res = await apiClient.api.users.me.$get();
  if (!res.ok) throw await toUpstreamError(res); // ステータスは route が決めない（errorMap が翻訳）
  const me = await readUpstreamJson(res);

  // 集約・整形・そぎ落とし: この画面に必要なフィールドだけ返す
  return c.json({
    registered: me.registered,
    email: me.email,
    artist: me.artist
      ? { accountId: me.artist.accountId, hasProfile: me.artist.hasProfile }
      : null,
  });
});

export default app;
```

```tsx
// src/app/dashboard/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth0 } from "../../libs/auth0";
import { getDashboard } from "../../fetchers/dashboard/getDashboard";

export default async function DashboardPage() {
  // SSR から fetcher 経由で自分の BFF read ルートを呼ぶ（cookie を転送する自己 HTTP hop）
  const cookie = (await headers()).get("cookie") ?? undefined;
  const result = await getDashboard({ cookie });
  if (!result.ok) throw new Error(result.error.message);
  const dashboard = result.value;

  if (!dashboard.registered) redirect("/onboarding");

  // 初期レンダリング: 整形済みデータを表示。編集部分は colocated な ClientAdapter へ渡す
  return (
    <DashboardScreen>
      <EmailEditorClientAdapter email={dashboard.email} />
      {dashboard.artist && (
        <AccountIdEditorClientAdapter accountId={dashboard.artist.accountId} />
      )}
    </DashboardScreen>
  );
}
```

- **整形・集約・そぎ落としは read route が担う**。`page.tsx` は route が返した形をそのまま描画に使い、取得・整形ロジックを持たない。
- **認証ガードは `page.tsx` に書かない**。ログイン必須パスは `src/middleware.ts` の `SESSION_REQUIRED_PATHS`（`/dashboard/*` `/onboarding/*`）で一元管理し、`requireSessionMiddleware` がセッション無しを `/auth/login` へ redirect する（[`authentication.md`「ミドルウェア構成」](../../authentication.md#ミドルウェア構成)）。`page.tsx` が持つのは `headers()`（cookie 転送）と `redirect()` の**実行**だけで、**「どこへ redirect するか」の判定**（データ由来の遷移・エラー時の遷移先）は純粋関数へ出す（[テスタビリティ](#テスタビリティ-テストしやすさを分離できているかの指標にする) 参照）。
- 例外: 画面が**セッションの中身**を必要とする場合（`onboarding` が `user.email` を登録に使う等）は、その値の有無を `page.tsx` で判定してよい。これは認証ガードではなくデータ要件の判定。
- `page.tsx` 自身はマークアップを所有し、**編集可能な部分だけを colocated な ClientAdapter に必要な値だけ渡す**（`packages/ui` の Page/Template に丸ごと委譲する形ではない）。

> **「整形」と「描画のための prop 配布」を混同しない**
> 上の例で `page.tsx` が `dashboard.email` や `dashboard.artist.accountId` といったフィールドへアクセスして子へ渡すのは、**整形ではなく描画のための prop 配布**である。整形（集約・命名変換・そぎ落とし・算出）は route 側で完了しており、`page.tsx` は「すでに画面用に整形された値を、対応する子コンポーネントに配る」だけ。`{...dashboard}` を丸渡しせず必要な値だけ渡すのは、各 ClientAdapter に不要データを渡さない（そぎ落とし）ためで、むしろ望ましい。
>
> 逆に、`page.tsx` 内で**複数フィールドを合成・改名・算出し始めたら**（例: `` `${d.firstName} ${d.lastName}` `` や `d.plan === "pro" && d.active`）、それは整形の漏れ出しなので route 側へ戻す。`page.tsx` は「受け取った値を配るだけ」に保つ。

### write の実装: HTTP ルート（`/api/*`）

- 配置: `src/app/api/[[...route]]/{resource}/{操作名}/index.ts`（例: `artists/me/updateMyAccountId/`。ディレクトリ構成の規約は [route の実装規約](#route-の実装規約は-api-server-と共有する) を参照）
- 責務: 入力バリデーション（`validators/validateRequest`）→ 必要なら自分の `userId` / `artistId` を解決（`shared/resolveMyUserId` / `shared/resolveMyArtistId`、内部で `GET /users/me`。見つからなければ型付きエラーを throw）→ `apiClient` で api-server へ送信 → 成功なら結果を返し、失敗なら `throw await toUpstreamError(res)`（**薄いパススルー**。ステータスの決定は route ではなく `errorMap`）。ブラウザ向け URL は `me` のままでよい（セッション主体への読み替えは BFF の責務。api-server 側は `/:userId` / `/:artistId` でアドレスする）。
- 認証 cookie: `requestContextMiddleware` がセッション cookie を付与した `apiClient`（= `createApiServerClient`）を `c.set("apiClient", ...)` する。ルートは `c.get("apiClient")` を使うだけ。

```ts
// src/app/api/[[...route]]/artists/me/updateMyAccountId/index.ts
const updateAccountIdRequestSchema = z.object({
  accountId: z.string().nonempty(),
});

const app = new Hono<RequestContextEnv>().post(
  "/",
  validateRequest("json", updateAccountIdRequestSchema), // 失敗は InvalidRequestFormatError を throw
  async (c) => {
    const apiClient = c.get("apiClient");
    const body = c.req.valid("json");

    const artistId = await resolveMyArtistId(apiClient); // 不在は MyArtistNotFoundError を throw

    const res = await apiClient.api.artists[":artistId"].$post({
      param: { artistId },
      json: { accountId: body.accountId },
    });
    if (!res.ok) throw await toUpstreamError(res); // 4xx は同じステータス・ボディで透過、5xx は 502

    return c.json(await readUpstreamJson(res));
  },
);
```

#### ファイルを扱う write（multipart/FormData）

JSON と同じく**薄いパススルー**で扱う。BFF はファイルの中身に触れない。

- 検証: `zValidator("form", z.object({ file: z.instanceof(File) }))`。「File であること」だけを UX 契約として弾く
- 送信: hono RPC の `{ form: { file } }` で **File をそのまま上流へ透過**する
- BFF で Buffer 化・再エンコード・サイズ/MIME の内容検証はしない（内容の検証は api-server のドメイン層とストレージ側の制約が担う）
- 失敗の扱いは JSON write と同じ（`throw await toUpstreamError(res)`）
- 上流のパスパラメータ（`:artistId` 等）は JSON write と同じく `shared/resolveMyArtistId` で解決し、hono RPC の `{ param }` で渡す（ブラウザ向け URL は `me` のまま）
- 実装例: `src/app/api/[[...route]]/artists/me/uploadMyProfileImage/index.ts`

```tsx
// src/app/dashboard/AccountIdEditorClientAdapter/hooks/useUpdateMyAccountId/index.ts
// CSR: hook → fetchers/artists/updateMyAccountId → /api/artists/me（write ルート）
const result = await updateMyAccountId({ accountId });
if (result.ok) router.refresh();
```

### 呼び出し面の集約: fetchers 層（`src/fetchers/`）

UI 層（`page.tsx` / hooks）は hono クライアントを直接生成しない。BFF `/api/*` への fetch は **`src/fetchers/` の関数だけ**が行い、UI はそれを呼ぶ。「どこで BFF が fetch されているか」を `src/fetchers/` の一覧だけで見渡せるようにするための集約点である。

- **構成**: BFF エンドポイント1つにつき1モジュール。`src/fetchers/<BFF ルートの名前空間>/<操作名>/index.ts`（+ `index.test.ts`）。例: `fetchers/artists/updateMyAccountId/`、`fetchers/dashboard/getProfileEditScreen/`。
- **責務**: クライアント生成（write = CSR は `createBeatfolioBffClient`、read = SSR は `createBeatfolioBffServerClient`。read は `cookie` を引数で受ける）・レスポンス解釈・エラー正規化。
- **契約**: `Promise<Result<T, FetcherError>>` を返し、**throw しない**（到達不能も catch して `unexpected` に正規化する）。`FetcherError` は `{ kind: "rejected" | "unexpected"; message: string }` — `rejected` はユーザー起因（400/409/422）でメッセージをそのまま画面に出せる、`unexpected` はそれ以外。共通処理は `fetchers/shared/error/` に置く。
- **型は BFF AppType から導出する**（`InferRequestType` / `InferResponseType`）。fetchers 層でリクエスト・レスポンスの型を手書きしない。
- **呼び出し側の責務**: hooks は状態管理（`isLoading` / `error` / `router.refresh`）に専念し、`page.tsx` は認証・`redirect`・描画に専念する。レスポンス解釈・エラー文言は fetchers 側にある。

```
read:  page.tsx ──▶ fetchers（SSR クライアント生成 + Result 正規化）──▶ /api/*（BFF read ルート）
write: hook     ──▶ fetchers（CSR クライアント生成 + Result 正規化）──▶ /api/*（BFF write ルート）
```

### クライアントの使い分け

| クライアント                     | 経路                            | 用途                                                                            |
| -------------------------------- | ------------------------------- | ------------------------------------------------------------------------------- |
| `createApiServerClient`          | サーバー → **api-server 直**    | BFF route（read / write）が `requestContext` 経由（`c.get("apiClient")`）で使う |
| `createBeatfolioBffClient`       | クライアント → **BFF `/api/*`** | **`src/fetchers/` だけが生成する**（CSR の write fetcher）                      |
| `createBeatfolioBffServerClient` | サーバー → **BFF `/api/*`**     | **`src/fetchers/` だけが生成する**（SSR の read fetcher。`cookie` を引き継ぐ）  |

> **命名の注意**: `createApiServerClient` は **api-server を直接叩くクライアント**（`hc<AppType>`、`AppType` は api-server のもの）。BFF `/api/*` を叩くのは `createBeatfolioBffClient` / `createBeatfolioBffServerClient` の方。名前の `ApiServer` / `BeatfolioBff` が「叩く先」を表す。

> **read の経路**: `page.tsx` は api-server を直接叩かず、**自分の BFF read ルート（`/api/*`）を HTTP で呼ぶ**。整形責務を route に集約し read/write の経路を対称に保つための設計で、自己 HTTP hop はその対価として受け入れる。SSR からの呼び出しは `createBeatfolioBffServerClient`（絶対 URL + cookie 転送）を使い、その生成は read fetcher（`src/fetchers/`）に閉じる。read / write とも全 BFF 呼び出しは fetchers 層経由に移行済み。

### バリデーションの役割分担

| レイヤー                | バリデーション | 役割                                                                            |
| ----------------------- | -------------- | ------------------------------------------------------------------------------- |
| BFF write ルート（zod） | あり           | **UX 契約**: 不正リクエストを境界で弾き、即時フィードバック可能なエラー形を返す |
| api-server              | あり           | **ドメイン不変条件**: Value Object 等による不変条件の保護                       |

両者で内容が重複することは許容する（責務が違う）。[`component-design.md`](../ui/component-design.md) のフォーム/ドメイン二重バリデーションと同じ整理。

### エラー契約

BFF が依拠するルールは **「api-server は応答する」「契約どおりの形を返す」** の2つ。この違反が BFF 層のエラーであり、api-server 側と同じ構造（型付きエラー + `errorMap` + エントリポイントでの一括変換）で扱う。

#### 不変条件: route は HTTP ステータスを書かない

> **失敗のステータスを知っているのは `errorMap`（`apps/beatfolio/src/errorMap/`）だけ。route は型付きエラーを `throw` するだけで、`c.json(body, status)` に失敗系ステータスを書かない**（成功系 2xx の明示は可）。

この不変条件は ESLint ローカルルール `local-bff/no-status-in-route`（`eslint.rules.mjs`）で機械的に検証する。ステータス決定が route に散ると「read は 502 に寄せる」「write は透過」といった判断が route ごとに手で再現され、変更が一箇所で済まなくなる。

#### 原則: BFF はステータスと種別を透過し、翻訳するのは文言のみ

api-server はエラーを型付きエラーで分類し、`errorMap` で `{ error, code, details? }` + ステータスに翻訳して返す（`code = AppError["type"]`）。BFF は **その分類を再分類・推定しない**。5xx は畳み、4xx は `code` で読み、読めなければ BFF 側の契約違反として扱う。ユーザー向け文言への翻訳（`code` → 日本語）は BFF の責務だが、現時点では上流のボディを透過している（翻訳表の導入は Issue #217）。

#### 失敗の分類（`shared/toUpstreamError` が 1 箇所で行う）

| 上流の状態                                       | 検知する層                                            | 型付きエラー                                    | HTTP                               | ログ  |
| ------------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------- | ---------------------------------- | ----- |
| 到達できない（DNS / 接続拒否 / timeout）         | `createApiServerClient`（fetch の reject を捕捉）     | `UpstreamUnavailableError`                      | 502                                | warn  |
| 5xx を返した                                     | `toUpstreamError`（ボディは読まない）                 | `UpstreamServerError`                           | 502                                | warn  |
| 4xx を返し、ボディに `code` がある               | `toUpstreamError`                                     | `UpstreamRejectedError`                         | **上流のステータス・ボディを透過** | info  |
| 4xx を返したが `code` が無い / ボディが解析不能  | `toUpstreamError`                                     | `UpstreamContractViolationError`                | 502                                | error |
| 成功応答のボディが解析できない                   | `shared/readUpstreamJson`                             | `UpstreamContractViolationError`                | 502                                | error |
| セッション主体が未登録 / artist 不在             | `shared/resolveMyUserId` / `shared/resolveMyArtistId` | `MyUserNotFoundError` / `MyArtistNotFoundError` | 404                                | info  |
| 画面の対象が不在（未公開・存在しない accountId） | 各 read route                                         | `PlayerNotFoundError` 等                        | 404                                | info  |
| BFF へのリクエスト形式が不正                     | `validators/validateRequest`                          | `InvalidRequestFormatError`                     | 400 + `issues`                     | info  |

- **到達不能の検知は route ではなく client 層**が担う。route ごとに `try/catch` を重ねない。
- **route の失敗パスは `if (!res.ok) throw await toUpstreamError(res);` の 1 行**。成功応答の読み取りは `await readUpstreamJson(res)`。`route.ts` の `.onError(handleBffError)` が `errorMap` で HTTP へ変換する。
- **read も write も同じ経路**。read で「対象の不在」を画面が区別する必要がある場合（`players/getPlayerDetail` の 404）は、route が意味を判定して専用の型付きエラー（`PlayerNotFoundError`）を throw する。ステータスは `errorMap` 側にある。
- **未知のエラーは 500 + `console.error`**。上流障害（502）と BFF 自身のバグ（500）を混ぜない（[エラーハンドリングの層責務](../../server/error-handling/layer-responsibilities.md#例外-bff-から見た-api-serverゲートウェイの上流障害)）。
- BFF の `errorMap` が返すボディも `{ error, code }` を持つ（`code = BffError["type"]`）。`UpstreamRejectedError` は上流のボディをそのまま返すため、`code` は api-server のものになる。
- **`page.tsx`（read 呼び出し側）**: BFF read ルートのレスポンスを純粋関数（resolver）に渡し、その判定に従って `redirect()` 実行 or 描画する（throw でエラーバウンダリに委ねる選択も resolver の戻り値で表現する）。

> **未対応（今後の検討）**
> 到達不能を timeout（504）と接続失敗（502）に分けること、`code` → 日本語文言の翻訳表（#217）、read の部分失敗をセクション単位で返すこと（#241）、`page.tsx` 側の失敗表示（#219）は未設計。

### テスタビリティ: テストしやすさを「分離できているか」の指標にする

> **テストしづらい箇所は、たいてい責務が分離できていないサイン。** 何がどこでテストされるかを設計時に決める。

`page.tsx`（async RSC）は `headers()` / `redirect()` / `fetch` / 描画が絡み、**単体テストが難しい**。だからテストしたいロジックを `page.tsx` の外（テスト可能な単位）へ出す。

| テストしたいもの                               | テストする場所                      | 理由                                                                                          |
| ---------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| read の整形・そぎ落とし・api-server エラー透過 | **BFF read route**（Hono ハンドラ） | mock した apiClient を渡し「api-server が X を返したら route は Y／エラーは透過」を単体テスト |
| **「どこへ redirect／何を描く」の判定**        | **純粋関数（resolver）**            | データ → 遷移先の写像。Next 非依存なので入出力だけで網羅テストできる                          |
| write の検証・パススルー                       | **BFF write route**                 | zod で弾く／api-server へ素通し、を route 単体でテスト                                        |
| 認証ガード                                     | `src/middleware.ts`                 | パス表（`SESSION_REQUIRED_PATHS`）に対する合成テスト（`middleware.test.ts`）で担保            |
| `redirect` の実行・描画                        | `page.tsx`（薄いグルー）            | Next API の副作用そのもの。分岐判断を持たないので単体テスト対象から外し、結合/e2e で担保      |

**redirect 先（エラー時含む）は `page.tsx` の責務ではなく純粋関数の責務**にする。`page.tsx` は判定結果を受けて `redirect()` を「実行する」だけにとどめる。

```ts
// src/app/dashboard/resolveDashboardView.ts  ← Next 非依存・純粋（単体テスト対象）
type DashboardView =
  | { kind: "redirect"; to: string }
  | { kind: "render"; data: DashboardData };

export function resolveDashboardView(
  result: { ok: true; data: DashboardData } | { ok: false },
): DashboardView {
  if (!result.ok) return { kind: "redirect", to: "/error" };
  if (!result.data.registered) return { kind: "redirect", to: "/onboarding" };
  return { kind: "render", data: result.data };
}
```

```tsx
// page.tsx は「判定の実行」だけ持つ（分岐ロジックは resolver 側）
const res = await createBeatfolioBffClient({ cookie }).api.dashboard.$get();
const view = resolveDashboardView(
  res.ok ? { ok: true, data: await res.json() } : { ok: false },
);
if (view.kind === "redirect") redirect(view.to);
return <DashboardScreen>{/* view.data を配る */}</DashboardScreen>;
```

- 認証ガード（セッション無し → `/auth/login`）は `page.tsx` ではなく `middleware.ts` の責務。データ由来の遷移（`registered` 等）は純粋関数へ。
- 単一の `if` で済む単純な画面なら resolver を作らずインラインでよい。**遷移条件に分岐が増え、テストしたくなった時点で resolver に切り出す**のが判断基準（過剰抽象を避ける）。

### ディレクトリ構造

```
apps/beatfolio/src/
├── app/
│   ├── {page}/page.tsx                    # SSR: 認証 → BFF read ルート呼び出し → redirect → 初期レンダリング
│   └── api/[[...route]]/
│       ├── route.ts                       # basePath + requestContextMiddleware + onError(handleBffError) + トップ mount
│       ├── {screen}/index.ts              # read:  境界のマウントテーブル（画面名。例: dashboard/）
│       ├── {screen}/{操作名}/index.ts     #        read ルート本体（例: dashboard/getDashboard/ getSettings/ getProfileEditScreen/）
│       ├── {resource}/index.ts            # write: 境界のマウントテーブル（例: artists/ → /me）
│       ├── {resource}/me/{操作名}/index.ts #       write ルート本体（例: artists/me/updateMyAccountId/ saveMyProfile/）
│       ├── errors/{errorName}/index.ts    # BFF エントリポイント固有の型付きエラー（upstreamRejected 等）
│       ├── validators/validateRequest/    # zValidator を InvalidRequestFormatError の throw に統一
│       └── shared/                        # route 横断の helper（toUpstreamError / readUpstreamJson / resolveMy*）
├── errorMap/index.ts                      # BffError → HTTP の翻訳表（ステータスを知る唯一の場所）
└── utils/client/index.ts                  # createApiServerClient（route→api-server直）/ createBeatfolioBffClient（→BFF /api/*）
```

---
