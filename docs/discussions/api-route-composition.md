# API ルート構成の見直し（メソッド名ディレクトリの廃止）

> 状態: 提案（未合意）。合意したら `docs/architecture/server/api-design-guidelines.md` の「ファイル構成」節を差し替える。

## 現状

`app/api/[[...route]]` は **1 ユニット = 1 エンドポイント**を、**HTTP メソッド名のディレクトリ + `index.ts`** で表現している。

```
artists/
  index.ts                        # 合成
  get/index.ts                    → GET  /artists
  [accountId]/get/index.ts        → GET  /artists/:accountId
  me/
    index.ts                      # 合成 + requireAuth
    post/index.ts                 → POST /artists/me
    profile/
      index.ts                    # 合成
      get/index.ts                → GET  /artists/me/profile
      post/index.ts               → POST /artists/me/profile
      publish/post/index.ts       → POST /artists/me/profile/publish
```

現在のエンドポイント全量（11 本）:

| メソッド | パス                          | ユースケース       |
| -------- | ----------------------------- | ------------------ |
| GET      | `/test`                       | -                  |
| POST     | `/users`                      | createUser         |
| GET      | `/users/me`                   | getMe              |
| POST     | `/users/me`                   | updateMyEmail      |
| GET      | `/artists`                    | listPublicProfiles |
| GET      | `/artists/:accountId`         | getPublicProfile   |
| POST     | `/artists/me`                 | updateMyAccountId  |
| GET      | `/artists/me/profile`         | getMyProfile       |
| POST     | `/artists/me/profile`         | saveMyProfile      |
| POST     | `/artists/me/profile/publish` | publishMyProfile   |
| GET      | `/link-types`                 | listLinkTypes      |

## 何が問題か

### 1. ディレクトリ木が URL について嘘をつく（本質）

ディレクトリ階層は「URL パス階層」を写す約束になっているのに、末端だけ「HTTP メソッド」という**異質な軸**が挿し込まれている。結果、木を読むと存在しない URL に見える。

```
artists/me/profile/publish/post/index.ts
→ 木の読み: /artists/me/profile/publish/post
→ 実際:     POST /artists/me/profile/publish
```

メソッドはリソース階層の子ではない。同じ軸に並べている限りこの違和感は消えない。

### 2. `index.ts` が 2 つの意味を持つ

`artists/index.ts`（合成ルーター）と `artists/get/index.ts`（エンドポイント実装）は同名で役割が違う。区別できるのは import 名（`import listPublicProfiles from "./get"`）だけで、ファイル名からは分からない。`api-server/src` には `index.ts` が 30 個以上あり、エディタのタブ・ファジー検索では識別できない。

### 3. 階層が 1 段深くなり、相対 import が伸びる

`artists/me/profile/publish/post/index.ts` からの参照は `../` × 8。

```
../../../../../../../../infrastructure/capabilities
```

`tsconfig.json` に `@/*` → `./src/*` が定義済みだが、**使用箇所は 0 件**。

### 4. `[accountId]` は意味を持たないディレクトリ名

`[[...route]]` の内側なので Next.js のルーティング対象ではなく、`[accountId]` という命名は何も効かせていない。さらに `api-design-guidelines.md` は「`:param` 系は記述的なパスディレクトリ名（例 `detail/`）」と規定しており、**ドキュメント違反**でもある（beatfolio BFF 側は `players/detail/get` で規約に従っている）。

### 5. マウント順の依存が構造に現れない

`artists/index.ts` は `/me` を `/:accountId` より先にマウントしている。Hono は static と param の勝敗を**登録順**で決めるため、この順序は動作を左右する（検証済み: `.route("/a", param)` を先に置くと後続の static `/a/me` は到達しない）。

現時点で `GET /artists/me` は未登録なので実害はないが、将来追加したときに順序次第で静かに `:accountId = "me"` に吸われる。コメントを書かない方針なので、**構造か型か検査で表現されていないと気づけない**。

なお各合成ルーターのテストが `routeSurface()` を assert しており、ここは部分的に担保されている。

### 6. 全エンドポイントで Result → Response の変換が重複

```typescript
if (!result.ok) {
  return handleAppError(result.error, c);
}
return c.json(result.value);
```

11 本すべてに同じ 4 行がある。

---

## 案 1: メソッド名ディレクトリを「操作名ディレクトリ」に置き換える（推奨）

末端ディレクトリ名を HTTP メソッドではなく**操作名（= ユースケース名）**にする。メソッドとパスの末端形（`:param`・アクション接尾辞）は、これまで通りハンドラとマウント側が持つ。

```
artists/
  index.ts                              # 合成（+ マウント順）
  listPublicProfiles/index.ts           → GET  /artists
  getPublicProfile/index.ts             → GET  /artists/:accountId
  me/
    index.ts                            # 合成 + requireAuth
    updateMyAccountId/index.ts          → POST /artists/me
    profile/
      index.ts                          # 合成
      getMyProfile/index.ts             → GET  /artists/me/profile
      saveMyProfile/index.ts            → POST /artists/me/profile
      publishMyProfile/index.ts         → POST /artists/me/profile/publish
```

構成ルール:

- ディレクトリ階層が写すのは **複数エンドポイントを束ねる中間ノード**（`artists` / `me` / `profile`）だけ。
- 末端は **操作名ディレクトリ + `index.ts`**。`index.ts` は「合成」または「1 エンドポイント」のどちらかで、**親に `index.ts` 以外の兄弟がいれば合成、なければ実装**という曖昧さは消え、名前で判別できる。
- 末端固有のパス（`/:accountId`、`/publish`）はハンドラの `.get("/:accountId")` / マウントの `.route("/publish", …)` で表す。`[accountId]/` や `detail/` のような飾りディレクトリは作らない。
- 操作名は `usecases/` のモジュール名と 1:1 で揃える（`listPublicProfiles` → `usecases/artistProfiles/listPublicProfiles`）。

得られるもの:

- メソッドが階層軸から消える（違和感の原因を除去）
- 「ディレクトリ + `index.ts`」というプロジェクト共通規約を維持（`domain/` `usecases/` と同形）
- ファイル識別子が操作名になり、検索・タブで判別できる
- 階層が 1 段浅くなる（`../` × 8 → × 7、`@/*` 併用で解消）
- Hono の合成チェーン・RPC 型（beatfolio が `hc<ApiServerAppType>` で消費）は無変更
- 変更は**ディレクトリ rename + import 名の付け替えのみ**。ハンドラ本体・テスト本体に手を入れない

失うもの:

- 木を見ただけではメソッドが分からない（`index.ts` を開く or 親の合成を読む）。→ 操作名の動詞（`get*` / `save*` / `publish*` / `list*`）とルート面テストで補う

## 案 2: メソッドをファイル名に降ろす

```
artists/
  index.ts
  get.ts                    → GET  /artists
  detail/get.ts             → GET  /artists/:accountId
  me/
    index.ts
    post.ts                 → POST /artists/me
    profile/
      index.ts
      get.ts                → GET  /artists/me/profile
      post.ts               → POST /artists/me/profile
      publish/post.ts       → POST /artists/me/profile/publish
```

- 階層が 1 段浅くなり、メソッドが階層軸から外れる
- テストは `get.test.ts` を併置
- ただし「ディレクトリ + `index.ts`」規約から外れ、`api-design-guidelines.md` が明示的に否定している形（`get.ts` のような単一ファイル形は使わない）に戻る
- ファイル名が `get.ts` / `post.ts` に量産され、識別性は案 1 より低い

## 案 3: 単一ルーティング表に集約する

各エンドポイントが**自分のフルパスを 1 行で宣言**し、トップの表は「順序」と「認証グループ」だけを持つ。

```typescript
// routes/index.ts
const app = new Hono()
  .basePath("/api")
  .use("*", requestContextMiddleware)
  .use("/users/*", requireAuthMiddleware)
  .use("/artists/me/*", requireAuthMiddleware)
  .route("/", listLinkTypes) // GET  /link-types
  .route("/", listPublicProfiles) // GET  /artists
  .route("/", getMyProfile) // GET  /artists/me/profile
  .route("/", getPublicProfile) // GET  /artists/:accountId
  .onError(handleAppError);
```

- API 全量とマウント順・認証境界が**1 ファイルで読める**（問題 5 が構造として解決）
- 木は URL を写さなくなるので、そもそも嘘をつかない
- 一方で各エンドポイントがパス前置（`/artists/me/profile`）を重複して持ち、リネーム時に N ファイル触る
- 認証が階層まとめの `use("*")` から明示的な path パターンに変わる（可視化される代わりに書き漏らしが 1 箇所に集約）
- #205 で入れた階層合成をほぼ書き直す規模

---

## どの案でも独立して入れたい整理

1. **`@/*` エイリアスを使う** — `../` × 8 を撤廃（設定済み・未使用）
2. **Result → Response 変換の共通化** — 11 本で重複している 4 行を 1 関数へ
3. **`[accountId]/` の廃止** — Next の catch-all 配下で `[]` は無意味。案 1 なら不要、案 2 なら `detail/`（規約準拠）

## 推奨

**案 1**。「メソッドが階層軸に混ざっている」という違和感の原因を直接取り除きつつ、1 エンドポイント 1 ユニット・ディレクトリ + `index.ts`・Hono RPC 型・既存テストのすべてを維持でき、変更が rename に収まる。

案 3 は一覧性の理想形だが、直近の #205（階層合成への移行）を巻き戻す規模になるため、案 1 を入れた上でエンドポイントが増えてから再評価する。
