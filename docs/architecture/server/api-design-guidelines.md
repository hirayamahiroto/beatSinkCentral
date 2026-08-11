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

## ファイル構成：1エンドポイント1ユニット（メソッド名ディレクトリ + index.ts）

ルート（`src/routes/`）は **1 ユニット = 1 エンドポイント（1 HTTP メソッド + 1 パス）** で構成する。

- **取得（GET）と保存（POST）は同じエンドポイント**。「使用例」の `GET /users/:id`（詳細取得）と `POST /users/:id`（更新）のように、**同じパスをメソッドで切り替えるだけ**。これを**別ユニットに分離**する。
- プロジェクト共通の「ディレクトリ + `index.ts`」構成に揃える。**HTTP メソッドをディレクトリ名にし、その配下に `index.ts`**（`get/index.ts`・`post/index.ts`）。`get.ts` のような単一ファイル形や `save/` のような独自アクション名は使わない。
- ディレクトリ階層は URL パスを写し、最末端のメソッドディレクトリ名が HTTP メソッド。`:param` 系は記述的なパスディレクトリ名（例 `detail/`）を使う。
- アクションは「使用例」の `POST /users/:id/delete` と同じく **POST + パス接尾辞**で表し、`<接尾辞>/post/index.ts` に置く。
- 各 `index.ts` は単一メソッドの Hono app を `default export` し、`src/index.ts` が import して該当パスにマウントする（同一パスに GET/POST がある場合は同じ base path に複数回 `.route()`）。

```
src/routes/
  artists/
    detail/
      get/index.ts             → GET  /artists/:accountId
    me/
      profile/
        get/index.ts           → GET  /artists/me/profile
        post/index.ts          → POST /artists/me/profile
        publish/
          post/index.ts        → POST /artists/me/profile/publish
```

```typescript
// src/index.ts（同一パスにメソッド別ユニットをそれぞれマウント）
.route("/artists/me/profile", getMyProfile) // get/index.ts  → GET /
.route("/artists/me/profile", saveMyProfile) // post/index.ts → POST /
.route("/artists/me/profile/publish", publishMyProfile) // publish/post/index.ts → POST /
.route("/artists", getPublicProfile) // detail/get/index.ts → GET /:accountId
```

**理由**: エンドポイント単位で責務・変更差分・レビュー範囲が閉じる。1 ユニットに GET/POST/サブアクションが混在すると変更影響が追いにくくなる。各メソッドディレクトリにもテストを置く。

> **既存の例外**: 規約制定以前のルート（`users/me` 等）には GET/POST 同居ファイルが残っている。これらは順次このルールへ移行する。

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

本人のプロフィールは「1 ユーザー = 1 アーティスト」のため `me` スコープ。取得と保存は同一エンドポイントをメソッドで切り替える。

| 操作                     | メソッド | エンドポイント                |
| ------------------------ | -------- | ----------------------------- |
| 取得（本人・下書き含む） | GET      | `/artists/me/profile`         |
| 保存（作成・更新）       | POST     | `/artists/me/profile`         |
| 公開 / 非公開            | POST     | `/artists/me/profile/publish` |
| 公開詳細（誰でも）       | GET      | `/artists/:accountId`         |

- 取得 (GET) と保存 (POST) は **同じ `/artists/me/profile`**。`users` の `GET /users/:id` ⇔ `POST /users/:id` と同じ関係。
- 公開切り替えは `POST /users/:id/delete` と同じくアクションを接尾辞で表す（`/publish`）。
- 公開詳細は `GET /users/:id` と同じく ID（ここでは accountId ハンドル）で引く。

### レスポンス形式

> **TODO**: レスポンス形式は未定義。今後設計予定。

## 参考

- [architecture.md](./architecture.md) - api-server アーキテクチャ
