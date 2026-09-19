# 「取得と更新を分ける」方針に対する現状の違反一覧

> **位置づけ**: 監査記録。方針ドキュメント [`api-read-write-definition.md`](../architecture/server/api-read-write-definition.md) を規範に置く前提で、2026-09-05 時点のコードと既存ドキュメントを照合した結果。
> **同日に §5 の手順で対応済み**（既存構造の分割・取得応答の構造化・BFF の振り分け・規範ドキュメントの統一）。未実装の offers / listening-point と、§4 の判断点のうち handle / email 更新のパス形は据え置き。

照合した原則:

- 更新は情報の構造（行為）ごとに小さく複数。入力はその構造の項目だけ。成功応答は更新した構造だけ
- 取得は集約一本。応答は集約の構造そのまま。応答のキーは更新 API の構造名と一致させる
- 取得の応答に閲覧者の文脈（購読・関係・表示順・文言）を混ぜない
- BFF は read を厚く、write は構造ごとの更新 API に振り分ける薄い層

---

## 1. api-server のコード

### 1-1. 更新 API が集約全体を一本で保存している（最大の違反）

| 箇所                                                                               | 違反内容                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api-server/src/app/api/[[...route]]/artists/[artistId]/saveProfile/index.ts` | `POST /artists/:artistId/profile` が属性（name / tagline / genres / activityInfo）・Story 章（chapters）・SNS リンク（links）・画像 URL（imageUrl）を 1 リクエストで受ける。`attributes` / `story/chapters/:chapterKey` / `links` への分割に反する。入力型が全構造を受け付けるため「渡せない型にする」も満たしていない |
| `apps/api-server/src/usecases/artistProfiles/saveMyProfile/index.ts`               | 入力型が `ArtistProfileContent`（集約全体）。`reviseArtistProfile` が全項目を丸ごと置換する。「振る舞いは集約の一部だけを受け取り、残りには触らない」構造ごとの振る舞い（属性を直す／章を書く／繋ぎ先を変える）が存在しない                                                                                            |
| 同ルートの成功応答                                                                 | `{ handle, profile: {全項目} }` と集約全体を返している。「更新した構造だけを返す」に違反。`publishProfile`（`{ published }`）と `uploadProfileImage`（`{ imageUrl }`）は方針どおり                                                                                                                                     |
| `imageUrl` の入力                                                                  | テキスト保存の入力に画像 URL が含まれ、画像の更新経路が `profile/image` と `profile` の二重になっている。方針では画像は独立した構造                                                                                                                                                                                    |

### 1-2. 入力の項目名が方針の構造名と一致していない

| 項目             | 現状                                                        | 方針                                             | 備考                                                                                                                                           |
| ---------------- | ----------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| SNS リンク       | `{ type, url, label? }`                                     | `{ linkTypeCode, url }`                          | `label` はフロント（`toSaveProfileRequest`）が送っておらず実質未使用。VO `profileLink` と DB `artist_profile_links.label` を含めて要否を決める |
| Story 章の識別子 | `questionCode`（`beginning` / `turning_point` / `concept`） | `chapterKey`（`origin` / `turning` / `concept`） | DB マスタ `story_questions` と seed にも同じコードがある。どちらに寄せるか判断が要る                                                           |

### 1-3. 取得 API の応答形が「集約の構造そのまま」になっていない

| 箇所                                                                                           | 違反内容                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /artists/:artistId/profile`（`getProfile`）／`GET /artists/:handle`（`public/getArtist`） | どちらも `profile.name` `profile.chapters` `profile.links` のフラット構造。`attributes` / `story.chapters` / `listeningPoint` / `links` / `offer` / `published` の区切りが無く、「応答のキーは更新 API の構造と一致させる」を満たせない |
| `getProfile` の `storyQuestions`                                                               | 問いの表示文言（label）付きマスタが応答に混入している。「取得の応答に文言が混ざっていないか」に該当。ただし `interface-map.md` §5-4 で「マスタ API は作らず read に埋め込む」と決めた経緯があり、新方針とどちらを取るか要確認           |
| `getProfile` の `missingPublishFields`                                                         | 方針の `publishability: { ok, missingFields[] }` とはキー名だけの差分。`ok` は導出可能なので現状の形の方が checklist §11-1 に合う。名前の統一のみ                                                                                       |
| `GET /artists`（`listArtists`）                                                                | 投影が `{ handle, name, imageUrl }`。方針と `profile-information-design.md` §4 が求める「画像・名前・タグライン・ジャンル」に対し tagline と genres が無い                                                                              |

### 1-4. 方針に「既存」と書かれているが未実装

- `POST /artists/:artistId/offers`（オファー）と `listening-point`（聴きどころ）は api-server に存在しない。ドメイン・DB スキーマにも offer / listeningPoint は無い
- 方針ドキュメントの「既存」表記は実態と合っていないため修正が要る

---

## 2. BFF・フロントのコード

| 箇所                                                                                                                        | 状態                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/beatfolio/src/app/api/[[...route]]/artists/me/saveMyProfile/index.ts`                                                 | 単純パススルー。方針 §4 では「編集画面が全項目を一度に保存するなら BFF が構造ごとの更新 API に振り分けて順に呼ぶ」ため、振り分けロジックが必要になる。ルート名 `saveMyProfile` 自体は方針 §5 で「画面都合の合成として当面残す」扱い |
| `apps/beatfolio/src/app/dashboard/profile/edit/ProfileWizardClientAdapter/hooks/useSaveProfile/` ／ `toSaveProfileRequest/` | ウィザード全項目を 1 リクエストに詰めて送る前提。BFF が分割を吸収するなら変更不要だが、`SaveMyProfileInput` は BFF の `InferRequestType` 由来なので、BFF の入力形を変えれば追従が必要                                               |
| `apps/beatfolio/src/app/api/[[...route]]/players/getPlayerDetail/index.ts`                                                  | 章を 1 本に結合する暫定コード（`joinChapterBodies`）と `translation` / `listeningPoint` / `offer` の固定 `null` を持つ。BFF が組み替えるのは方針どおりで違反ではないが、暫定コメント付きのプレースホルダとして残っている            |

---

## 3. 規範ドキュメント同士の衝突

新方針を規範に置くと、次の既存ドキュメントが矛盾する。同時に修正が必要。

| ドキュメント                                                                      | 衝突箇所                                                                                                                                                                            |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/architecture/server/api-design-guidelines.md` §アーティストプロフィール操作 | 「保存（作成・更新）POST /artists/:artistId/profile」「取得と保存は同一エンドポイントをメソッドで切り替える」と明記。新方針と真っ向から衝突。ディレクトリ例の `saveProfile/` も同様 |
| `docs/architecture/server/architecture.md`                                        | ディレクトリ例（713 行付近）に `saveProfile/`                                                                                                                                       |
| `docs/architecture/server/database/concurrency.md`                                | 並行更新ポリシー表に `saveMyProfile` の LWW 行。分割後は更新ごと（属性・章・リンク）の行に置き換え                                                                                  |
| `docs/plans/know-to-support-beta/interface-map.md` §3（凍結済み）                 | 「Story 章の保存 = saveMyProfile の契約拡張」「聴きどころ = saveMyProfile の契約拡張」。このまま T07 を進めると違反が増える                                                         |
| `docs/architecture/frontend/bff/design.md`                                        | 例に `saveMyProfile/`。BFF ルートは残すので影響は小さい                                                                                                                             |

---

## 4. 判断が必要な点（方針の対象範囲）

- `POST /artists/:artistId`（handle 変更）と `POST /users/:userId`（email 変更）はパスに行為名が無い。新方針の表には載っておらず、`api-design-guidelines.md` の一般形（`POST /users/:id` = 更新）に従っている。今回の対象に含めるか
- `storyQuestions` を read に埋め込む（interface-map §5-4）か、文言を応答から外してマスタ API に出すか
- Story 章の識別子を方針側（`origin` / `turning` / `concept`）に寄せるか、既存コード側（`beginning` / `turning_point` / `concept`）に寄せるか
- SNS リンクの `label` を廃止するか

---

## 5. 着手順（案）

1. `api-design-guidelines.md` と `interface-map.md` を新方針に合わせて修正し、規範を一本化する
2. api-server: 更新 API を構造ごとに分割（`updateAttributes` / `writeStoryChapter` / `replaceLinks`）し、成功応答を構造単位にする。ドメインに構造ごとの振る舞いを追加
3. api-server: 取得 API の応答を集約の構造（`attributes` / `story` / `links` / `published` …）に組み替え、一覧に tagline / genres を追加
4. BFF: `saveMyProfile` を構造ごとの更新 API への振り分けに変更
5. フロント: BFF 契約の変更に追従
