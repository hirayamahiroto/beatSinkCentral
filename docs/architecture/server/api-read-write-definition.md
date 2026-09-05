# API の定義方法 — 取得と更新を分ける（アーティスト情報を例に）

> **このドキュメントの位置づけ**
>
> api-server の API を「取得」と「更新」で別々に定義する方法を、アーティスト情報を例に定める。
> [`api-design-guidelines.md`](./api-design-guidelines.md)（GET/POST のみ・リソースアドレッシング・1 ユニット 1 エンドポイント）を前提に、**エンドポイントの切り方**だけを扱う。
> 考え方の根拠は情報設計（[`profile-information-design.md`](../../product/profile-information-design.md) §2「属性と Story を分ける」）にある。まず §1 で背景と経緯を読み、§2 以降を運用に使う。

---

## 1. 背景と経緯 — なぜこの形に辿り着いたか

### 出発点の違和感

実装フローが「画面モック → API → データ」の順で組まれていた。情報設計の上で UI は表層であり最終的に表示されるだけなのに、バックエンドが画面都合に引っ張られ、汎用であるべき層に制約が効いていない、という感覚が最初にあった。

四つの設計（情報モデル・API・動線・画面）の役割分担、寿命の差、変更確率と取り消しコストの軸、単一クライアントでは汎用の比較対象が無いという構造的な問題、まで整理した。これらは根拠として正しいが、判断に使うには重かった。

### 転回点

1. **「何をしたいか」をモデルの語彙で言えば API は素直に出る。** 「章を書く」「公開する」はモデルの語彙、「編集画面を保存する」は画面の語彙。線引きは誰の語彙かだけで、「汎用かどうか」は「モデルが許す行為がすべて露出しているか」という完全性の問いに置き換わる。
2. **読み取りと更新は単位を決める軸が違う。** 更新は行為で、読み取りは誰が何のために見るかで決まる。旧 `saveMyProfile` の丸ごと保存は、画面に引かれたというより、read の形を write に流用した結果だった。
3. **今すぐ全部を作り替えるのではなく、境界の考え方を持つ。** レビューに「この API を画面名を使わずに説明できるか」を足すこと、これから新規に作るもの（オファー・購読・招待）を最初から境界の側で切ること。既存の丸ごと保存は、契機が来たときに §6 の手順で一度に直す。

この議論の価値は構造を今変えることではなく、変えるべき時が来たときに何をどう変えるかがすでに分かっている、という点にある。

---

## 2. 原則

**取得と更新は別々に定義する。同じリソースでも、更新は情報の構造ごとに分け、取得は集約でまとめて返す。**

| 種別 | 単位                   | 形                                   |
| ---- | ---------------------- | ------------------------------------ |
| 更新 | 情報の構造（行為）ごと | 小さく複数。入力はその構造の項目だけ |
| 取得 | 集約ごと               | 大きく一本。集約の構造をそのまま返す |

「情報の構造」は情報設計が定める区分（属性 / Story / 聴きどころ / SNS リンク / オファー / 画像 / 翻訳段落）を指す。画面の区画やボタンではない。

---

## 3. 更新 API — 構造ごとに分ける

**更新は行為の単位で切る。** 入力はその構造の項目だけを受け、他の構造には触らない。

| 構造       | 行為                  | エンドポイント                                       | 入力                                                   |
| ---------- | --------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| 属性       | 属性を直す            | `POST /artists/:artistId/attributes`                 | `{ name, tagline?, genres[], activityInfo? }`          |
| Story      | 章を書く              | `POST /artists/:artistId/story/chapters/:chapterKey` | `{ body }`（空文字は章を消す）                         |
| 聴きどころ | 聴きどころを設定する  | `POST /artists/:artistId/listening-point`（予定）    | `{ videoUrl, comment }`                                |
| SNS リンク | 繋ぎ先を変える        | `POST /artists/:artistId/links`                      | `{ links: [{ linkTypeCode, url }] }`（集合を差し替え） |
| オファー   | オファーを差し替える  | `POST /artists/:artistId/offers`（予定）             | `{ date, place, ticketUrl, comment, coPerformers[] }`  |
| 画像       | 画像を差し替える      | `POST /artists/:artistId/profile/image`（既存）      | multipart `file`。保存先 URL を集約に書き込む          |
| 公開       | 公開する / 取り下げる | `POST /artists/:artistId/profile/publish`（既存）    | `{ published }`                                        |
| 表現       | 見せ方を選ぶ          | `POST /artists/:artistId/presentation`               | `{ patternCode }`（`presentation_patterns.code`）      |
| 翻訳段落   | —                     | **作らない**（運営が直接書く）                       | —                                                      |

`chapterKey` は問いマスタ `story_questions.code` の値（`beginning` / `turning_point` / `concept`）。語彙は DB マスタ由来であり、URL に別名を導入しない（[`code-review-checklist.md`](../../../.claude/rules/code-review-checklist.md) §14）。

ルール:

- **入力はその構造の項目だけ。** 属性の更新に Story を渡さない。渡せない型にする。
- **集合は集合ごと差し替える。** SNS リンクは 1 本ずつ足す／消すではなく `links[]` を丸ごと受ける（順序も本人が決めるため）。要素単位の操作が必要になったら `links/:linkId/delete` を足す。
- **不変条件は各更新で拒否しない。** 公開可能性を理由に更新を弾くのは `publish` のときだけ（`ensurePublishable` の位置は変えない）。下書き中は部分的な状態を許す。ただし公開中のプロフィールが更新で公開条件を割ったときは非公開へ降ろす（`enforcePublishInvariant`）。公開 read の契約（`name` 必須等）を守るためで、更新自体は成功する。
- 更新の成功応答は、**更新した構造だけ**を返す（集約全体を返さない）。全体が必要なら取得 API を呼ぶ。
- 更新の名前は行為にする（`updateAttributes` / `writeStoryChapter` / `replaceLinks`）。画面名・ボタン名を入れない。

### ドメイン層との対応

集約は `ArtistProfile` 一つのまま。更新 API ごとに**集約の一部だけを受け取る振る舞い**を置き、残りの状態には触らない。

| 更新 API            | 振る舞い                                        | 受け取るもの                           |
| ------------------- | ----------------------------------------------- | -------------------------------------- |
| `updateAttributes`  | `ArtistProfile.reviseAttributes(content)`       | name / tagline / genres / activityInfo |
| `writeStoryChapter` | `ArtistProfile.writeStoryChapter(chapter)`      | questionCode / body                    |
| `replaceLinks`      | `ArtistProfile.replaceLinks(links)`             | links[]                                |
| `profile/image`     | `ArtistProfile.changeImage(imageUrl)`           | imageUrl                               |
| `presentation`      | `ArtistProfile.choosePresentationPattern(code)` | patternCode                            |

- 集約が未作成なら `createDraftArtistProfile({ artistId })` で空の下書きを作ってから振る舞いを適用する。どの構造から書き始めてもよい。
- リポジトリの `upsert` は集約全体のままでよい。振る舞いが返す集約をそのまま保存する。部分更新の最適化は必要になってから。
- 画像は外部ストレージへのアップロードとプロフィールへの URL 書き込みを分け、前者をトランザクションの外で行う（`code-review-checklist.md` §10）。ルートが「アップロード → URL を集約へ書く」の順に 2 つの usecase を呼ぶ。

### ルート構成

```
app/api/[[...route]]/artists/[artistId]/
  index.ts                         → requireAuthMiddleware + マウントテーブル
  updateHandle/index.ts            → POST /:artistId（既存）
  getProfile/index.ts              → GET  /:artistId/profile
  updateAttributes/index.ts        → POST /:artistId/attributes
  writeStoryChapter/index.ts       → POST /:artistId/story/chapters/:chapterKey
  replaceLinks/index.ts            → POST /:artistId/links
  choosePresentationPattern/index.ts → POST /:artistId/presentation
  uploadProfileImage/index.ts      → POST /:artistId/profile/image（既存）
  publishProfile/index.ts          → POST /:artistId/profile/publish（既存）
```

---

## 4. 取得 API — 集約でまとめて返す

**取得は集約一本。** 構造ごとに分けない。

| 対象               | エンドポイント                           | 認証 | 返すもの                                             |
| ------------------ | ---------------------------------------- | ---- | ---------------------------------------------------- |
| 公開プロフィール   | `GET /artists/:handle`（既存）           | 不要 | 公開済みの集約全体                                   |
| 本人のプロフィール | `GET /artists/:artistId/profile`（既存） | 必要 | 下書き含む集約全体 ＋ 公開可能性（不足項目）         |
| 一覧               | `GET /artists`（既存）                   | 不要 | 一覧用の属性のみ（画像・名前・タグライン・ジャンル） |

応答の形は**集約の構造そのまま**にする。

```json
{
  "handle": "...",
  "profile": {
    "attributes": {
      "name": "...",
      "imageUrl": "...",
      "tagline": "...",
      "genres": [],
      "activityInfo": "..."
    },
    "story": { "chapters": [{ "key": "beginning", "body": "..." }] },
    "links": [{ "linkTypeCode": "youtube", "url": "..." }],
    "presentation": { "patternCode": "interview" },
    "published": true
  },
  "publishability": { "ok": false, "missingFields": ["imageUrl"] }
}
```

- 本人向けは `profile` と `publishability` が未作成時に `null`。公開向けは `publishability` を持たず、`profile` は必ず存在する（無ければ 404）。
- 聴きどころ・オファー・翻訳段落は実装時に同じ階層へ `listeningPoint` / `offer` / `translation` として足す（未実装のうちはキーを出さない）。

ルール:

- **応答のキーは更新 API の構造と一致させる。** `attributes` / `story` / `links` / `presentation` が、そのまま更新エンドポイントの名前になる。`presentation.patternCode` は未選択なら `null`（既定の見せ方は BFF が決める）。
- **閲覧者の文脈を混ぜない。** 購読可否・共演者判定・表示順・文言（問いの設問文、リンク種別のラベル）は入れない。語彙の解決は BFF が汎用マスタ API（`GET /link-types` / `GET /story-questions` / `GET /presentation-patterns`）を引いて行う。
- **一覧は集約全体を返さない。** 一覧は属性の投影であり、別の read として置く（既存どおり）。
- 本人向け取得には `publishability: { ok, missingFields[] }` を含めてよい。これはドメインが決める情報（`ensurePublishable` の結果）で、画面都合ではない。

---

## 5. BFF との関係

| 種別 | BFF の役割                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------ |
| 取得 | 集約一本を受け取り、画面の区画・表示順・文言・閲覧者の文脈（購読可否・共演者判定）に組み替える。厚い               |
| 更新 | 画面の入力を、構造ごとの更新 API に振り分けて送る。編集画面が全項目を一度に保存するなら BFF が複数を順に呼ぶ。薄い |

- 編集画面の「保存」ボタン一つに対して api-server の更新 API が一つ、という対応にしない。**ボタンは画面の語彙、更新 API はモデルの語彙**。対応づけは BFF が持つ。
- BFF の `artists/me/saveMyProfile` は画面都合の合成であり、内部で `attributes` → `story/chapters/:chapterKey`（章ごと）→ `links` を順に呼ぶ。途中で失敗した場合は後続を送らず、失敗した呼び出しのエラー（ステータス・ボディ）に **保存済みステップ `saved[]` と失敗ステップ `failedAt`** を添えて返す（`PartialSaveFailedError`）。下書きの部分的な状態は許容するが、どこまで保存されたかは画面へ伝える。各更新は置換型で冪等なので、同じ入力での再送で全体が収束する。
- 画像は編集画面から `profile/image` へ直接アップロードされ、その時点で集約へ書き込まれる。`saveMyProfile` は画像 URL を受け取らない。

---

## 6. 既存の丸ごと保存からの移行手順

旧 `POST /artists/:artistId/profile`（`saveProfile` / `saveMyProfile`）は集約全体を 1 本で受けていた。構造ごとの更新へ切り替える手順を残す（2026-09-05 に実施済み）。

1. 構造ごとの振る舞い（`reviseAttributes` / `writeStoryChapter` / `replaceLinks` / `changeImage`）をドメインに足す
2. 構造ごとの usecase と更新エンドポイントを足す（expand）
3. BFF の `saveMyProfile` を構造ごとの呼び出しへ振り分ける（migrate）
4. 取得 API の応答を集約の構造（`attributes` / `story` / `links` / `published`）へ組み替え、BFF の read を追従させる
5. 旧 `POST /artists/:artistId/profile` と `saveMyProfile` usecase を削除する（contract）

契機になるのは、章ごとの編集画面・章ごとの計測・運営や AI による特定項目だけの書き込みが必要になったとき。それまでは interface-map に「`saveMyProfile` は画面都合の合成。構造としては属性／章／聴きどころ／リンク」と書いておく。

---

## 7. チェックリスト（API を足すとき）

- [ ] 更新か取得か、どちらの定義か決めたか
- [ ] 更新なら、入力はその構造の項目だけか。取得の出力型を流用していないか
- [ ] 更新の名前は行為か。画面名・ボタン名が入っていないか
- [ ] 取得なら、集約一本か。画面の区画に合わせて分けていないか
- [ ] 取得の応答に閲覧者の文脈（購読・関係・表示順・文言）が混ざっていないか
- [ ] 取得の応答キーと更新 API の構造名が一致しているか
- [ ] この API を画面名を使わずに説明できるか
