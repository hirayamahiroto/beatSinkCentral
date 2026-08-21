# API 設計ガイドライン

## 概要

本プロジェクトのAPIは、RESTfulの原則に基づきつつ、実用性と互換性を重視した設計方針を採用しています。

## HTTPメソッドの使用方針

### 基本方針

本APIでは **GET** と **POST** のみを使用し、**PUT** と **DELETE** は使用しません。

| メソッド | 用途                       | 使用 |
| -------- | -------------------------- | ---- |
| GET      | リソースの取得             | ○    |
| POST     | リソースの作成・更新・削除 | ○    |
| PUT      | -                          | ×    |
| DELETE   | -                          | ×    |

### 操作とエンドポイントの対応

```
GET  /users          → ユーザー一覧取得
GET  /users/:id      → 特定ユーザー取得
POST /users          → ユーザー作成
POST /users/:id      → ユーザー更新
POST /users/:id/delete → ユーザー削除
```

## 設計思想：クライアントとサーバーの責務分離

本APIの設計は、以下の原則に基づいています。

```
┌─────────────────┐          ┌─────────────────┐
│    クライアント    │  ─────→  │     サーバー      │
│                 │  リクエスト │                 │
│  事前情報不要     │  ←─────  │  評価して結果返却  │
│  依頼するだけ     │  レスポンス │  判断の責任を持つ  │
└─────────────────┘          └─────────────────┘
```

| 役割         | 責務                                                                       |
| ------------ | -------------------------------------------------------------------------- |
| クライアント | リクエストを送るだけ。事前にサーバーの内部構造を知る必要がない             |
| サーバー     | リクエストを評価し、結果を返す。リソースの識別・管理はすべてサーバーが担当 |

## PUT を使用しない理由

### クライアントに事前知識を要求してしまう

POSTとPUTでは、リソースの識別情報（ID）の扱いが異なります。

| メソッド | ID の発行者    | クライアントの事前知識                 |
| -------- | -------------- | -------------------------------------- |
| POST     | サーバー側     | 不要                                   |
| PUT      | クライアント側 | 必要（識別体系を知っている必要がある） |

PUTでは、クライアントがリソースのIDを指定します。つまり、クライアントはサーバーのリソース識別体系を事前に知っている必要があります。

これは「クライアントはリクエストするだけ」という原則に反します。

### 応答仕様が曖昧になる

PUTには返すべき応答内容の規定がなく、成功時のステータスコードも複数あります。

| 状況     | 選択肢                           |
| -------- | -------------------------------- |
| 新規作成 | `201 Created`                    |
| 既存更新 | `200 OK` または `204 No Content` |

決め事が増えるほど、クライアントとサーバーの結合は密になり、APIの修正や拡張が難しくなります。

### POSTなら疎結合を維持できる

```
POST /users          → サーバーがIDを発行して返す
POST /users/:id      → 更新（IDは取得済みのものを使用）
```

POSTを使うことで：

- クライアントは事前情報なしでリクエスト可能
- サーバーがリソース識別を一元管理
- 将来の修正や拡張の影響を最小化

## DELETE を使用しない理由

### POSTで代替可能

削除操作は以下の形式でPOSTで実現します。

```
POST /users/:id/delete
```

### 設計の一貫性

- **GET**: 参照（サーバーの状態を変えない）
- **POST**: 変更（サーバーの状態を変える）

この明確な役割分担により、シンプルで予測可能なAPI設計を維持できます。

## リソースアドレッシング（パスキーの選び方）

エンドポイントの URL は**ドメインモデルの現状（例: 1 ユーザー = 1 アーティスト）に依存させず、リソース指向で設計する**。URL は外部契約でありモデルより寿命が長いため、モデルの都合を URL に焼き込むと、モデル変更が URL の破壊的変更に波及する。

| 原則                 | 内容                                                                                                                                                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 対象はパスで指定する | 操作対象のリソースは `/artists/:artistId/...` のようにパスでアドレスする。`me` のような「セッションの主体に暗黙で紐づく」パスは新設しない                                                                                              |
| パスキーは不変 ID    | 書き込み・認証済み参照のパスキーは**不変なリソース ID**（`artistId` = UUID）を使う。`accountId` のような**可変ハンドルは公開 read 専用**（SEO・シェア URL 向け）とし、書き込みの宛先に使わない（リネームと古いハンドルの問題を避ける） |
| 主体はセッションから | 「誰が」はパスやボディでなくセッション（`sub`）から解決する。パスの対象リソースに対してその主体が操作できるかは authorization 層が照合する（対象の選択 = パス、本人性 = セッション、可否 = 認可、の分離）                              |
| 不一致は 404         | パスのリソースに主体がアクセスできない場合は 404 を返す（リソースの存在を秘匿する）                                                                                                                                                    |

- クライアントは自分の `artistId` を `GET /users/me` から取得する。
- **既存の `me` 系ルート（`/artists/me/*`）は廃止予定**。expand（`/:artistId` 系を追加）→ migrate（クライアント切り替え）→ contract（`me` 削除）の順で移行中であり、新規エンドポイントを `me` 配下に足さない。

## リソース命名規則

### 複数形を使用

リソース名は複数形で統一します。これはリソースを「コレクション」として捉える考え方に基づいています。

```
○ /users
○ /posts
○ /comments

× /user
× /post
× /comment
```

### 操作を表す場合

削除など、メソッドだけでは意図が不明確な操作には、アクションを明示します。

```
POST /users/:id/delete      → 削除
POST /users/:id/deactivate  → 無効化
POST /orders/:id/cancel     → キャンセル
```

## ファイル構成：1エンドポイント1ユニット（意図名ディレクトリ + index.ts）

ルート（`app/api/[[...route]]`）は **1 ユニット = 1 エンドポイント（1 HTTP メソッド + 1 パス）** で構成する。ただし **ディレクトリを掘るのはリソースの境目とミドルウェアが変わる境目だけ**で、URL セグメントの数だけ階層を作らない。

- **取得（GET）と保存（POST）は別ユニット**。「使用例」の `GET /users/:id`（詳細取得）と `POST /users/:id`（更新）のように同じパスをメソッドで切り替える場合も、別ユニットに分離する。
- ユニットは「ディレクトリ + `index.ts`」構成（+ 同階層 `index.test.ts`）。**ディレクトリ名はエンドポイントの意図を表す名前**にする（`updateAccountId/` `getProfile/` `saveProfile/` `publishProfile/` 等）。HTTP メソッド名のディレクトリ（`get/` `post/`）や method を埋め込んだファイル名（`profile.publish.post.ts`）は使わない。
- ミドルウェアが変わる境界の `index.ts` が「path → ユニット」の対応表（マウントテーブル）を `.route()` で宣言する。ユニット自身は小さな Hono app として自分からの相対パス（`"/"` 等）と自分のバリデーション（`validateRequest`）だけを持ち、実際の絶対 URL は境界の `index.ts` だけが知っている。バリデーションは Hono の型推論の都合上、ユニットの Hono チェーン内で行う（境界側に持ち出さない）。
- アクションは「使用例」の `POST /users/:id/delete` と同じ意図を、ディレクトリ名（`deleteUser/`）で表す。独自の method 接尾辞ファイル名は使わない。

```
app/api/[[...route]]/
  artists/
    [accountId]/
      get/index.ts                → GET  /artists/:accountId（公開詳細。境界外なので旧規約のまま）
    [artistId]/                   ← 認証境界
      index.ts                    → requireAuthMiddleware + マウントテーブル
      updateAccountId/index.ts    → POST /:artistId
      getProfile/index.ts         → GET  /:artistId/profile
      saveProfile/index.ts        → POST /:artistId/profile
      publishProfile/index.ts     → POST /:artistId/profile/publish
```

```typescript
// artists/[artistId]/index.ts（境界のマウントテーブル）
// 裸の "/" は公開ルート GET /:accountId と同形状で衝突するため、
// .use("*", ...) ではなく衝突しないサブパス "/profile/*" だけに適用する。
// 裸パスを使う updateAccountId は自分で requireAuthMiddleware を適用する（下記）。
import { Hono } from "hono";
import updateAccountId from "./updateAccountId";
import getProfile from "./getProfile";
import saveProfile from "./saveProfile";
import publishProfile from "./publishProfile";
import { requireAuthMiddleware } from "../../../../../middlewares/auth0";

const app = new Hono()
  .use("/profile/*", requireAuthMiddleware)
  .route("/", updateAccountId)
  .route("/profile", getProfile)
  .route("/profile", saveProfile)
  .route("/profile/publish", publishProfile);

export default app;
```

```typescript
// artists/[artistId]/updateAccountId/index.ts（裸パスのユニット。衝突するため自分で認証を適用する）
const app = new Hono().post(
  "/",
  requireAuthMiddleware,
  validateRequest("param", paramSchema),
  validateRequest("json", updateAccountIdRequestSchema),
  async (c) => {
    /* ... */
  },
);

export default app;
```

> **注意**: `.use("*", mw)` は同じ裸パスを共有する別リソースの公開ルート（今回は `GET /:accountId`）まで巻き込んで認証してしまう。境界の認証適用は「衝突しないサブパスだけ `.use()`、衝突する裸パスは個別ユニットで適用」を徹底する（詳細は [architecture.md](./architecture.md) の該当注意を参照）。

**理由**: エンドポイント単位で責務・変更差分・レビュー範囲を閉じつつ（1 ユニット1エンドポイントを維持）、URL セグメントをすべてディレクトリに写すと階層が深くなりすぎる問題を避ける。マウントテーブルを境界の `index.ts` に集約することで、その境界配下に何が生えているかを1箇所で見渡せる。各ユニットにもテストを置く（`index.test.ts`）。

> **既存の例外**: 規約制定以前のルート（`users/`, `link-types/`, `artists/me/`, `artists/get`, `artists/[accountId]/get` 等）には HTTP メソッド名ディレクトリが残っている。これらは新規実装・変更時にこの規約へ順次移行する。

## 使用例

### ユーザー操作

| 操作     | メソッド | エンドポイント      |
| -------- | -------- | ------------------- |
| 一覧取得 | GET      | `/users`            |
| 詳細取得 | GET      | `/users/:id`        |
| 作成     | POST     | `/users`            |
| 更新     | POST     | `/users/:id`        |
| 削除     | POST     | `/users/:id/delete` |

### アーティストプロフィール操作

対象アーティストは不変 ID（`artistId`）でアドレスし、操作可否は authorization 層が「セッションの主体がその artistId に書けるか」を照合する。取得と保存は同一エンドポイントをメソッドで切り替える。

| 操作                     | メソッド | エンドポイント                       |
| ------------------------ | -------- | ------------------------------------ |
| 取得（本人・下書き含む） | GET      | `/artists/:artistId/profile`         |
| 保存（作成・更新）       | POST     | `/artists/:artistId/profile`         |
| 公開 / 非公開            | POST     | `/artists/:artistId/profile/publish` |
| accountId 変更           | POST     | `/artists/:artistId`                 |
| 公開詳細（誰でも）       | GET      | `/artists/:accountId`                |

- 取得 (GET) と保存 (POST) は **同じ `/artists/:artistId/profile`**。`users` の `GET /users/:id` ⇔ `POST /users/:id` と同じ関係。
- 公開切り替えは `POST /users/:id/delete` と同じくアクションを接尾辞で表す（`/publish`）。
- 公開詳細のみ可変ハンドル（accountId）で引く。認証済み操作のパスキーは不変 ID（artistId）。
- **移行中の例外**: 旧 `me` 系ルート（`/artists/me/*`）はクライアント移行が完了するまで併存させ、その後削除する。

### レスポンス形式

> **TODO**: レスポンス形式は未定義。今後設計予定。

## 参考

- [architecture.md](./architecture.md) - api-server アーキテクチャ
