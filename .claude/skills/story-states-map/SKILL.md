---
name: story-states-map
description: >-
  検証対象の画面/コンポーネントの木を辿り、composition leaf を「信頼できる primitive」と「検証対象の合成」に
  仕分け（primitive は刈る）、各合成の「観測可能なレンダリング状態」を洗い出して基準カタログ
  (状態 × 期待値marker × カバー状況) を起こす skill。期待値marker の出所は必ず仕様(Figma/PR body/文言定数)
  に置き、実装からは取らない（循環回避）。story-states パイプラインの ①map ステージ。
  ユーザーが「状態を洗い出して」「story化の前準備」「この画面の状態カタログ」「評価軸を起こして」等と言ったとき、
  または特定の画面/コンポーネントを渡して状態網羅の検証設計を求めたときに使う。②gen / ③run / ④triage と連携する。
---

# story-states-map — 検証対象の状態カタログを起こす（①map）

**前提となる設計思想**（story-states パイプライン共通）:

- 検証対象は「部品が正しいか」ではなく「**信頼できる部品を組んだ実装が仕様どおりか**」= composition の spec-conformance。
- **信頼境界**: design-system の primitive = **atoms**（`packages/ui/src/design-system/components/atoms`。shadcn を薄くラップし色味のみ上書き・自前 story あり）は信頼して**刈る**。検証対象は **organisms / pages / templates**（および compose する molecules）＝ `packages/ui/src/design-system/components/{organisms,pages,templates,molecules}`。バグは合成に棲む。
- **オラクル独立**: 「正しい」の定義（期待値）は**実装から独立した仕様**（Figma / PR body / 文言定数）から取る。実装を読んで期待値を作ると「コードがコード通り動く」しか言えない（循環）。

このステージのゴールは、後続 ②gen が機械的に story+play を生成できる**基準カタログ**を作ること。

## このリポジトリの前提（beatSinkCentral）

- Storybook は **`packages/ui` のみ**。`apps/beatfolio` に Storybook は無い。
- `packages/ui` は **Next 非依存**（規範）。データ取得 hook / server action / `next/*` は **app 層（apps/beatfolio）** に置かれ、Storybook 対象外。よって packages/ui の合成 leaf の「結合」は主に **React context / 表示制御 hook**。状態管理ライブラリ（Jotai 等）は不使用。
- component は Atomic Design：`atoms / molecules / organisms / pages / templates`。

## 入力

- 対象の指定：`packages/ui` の合成コンポーネント名（例「PlayersPage」）またはファイルパス
- （あれば）仕様ソース：Figma node / PR番号 / 該当機能の文言定義。無ければ「※仕様確認」として明記して洗い出す

## 手順

### 1. 木を辿って leaf を仕分ける

entry（design-system の `pages` / `templates` → 内部の `organisms` → `molecules` / `atoms`）から辿り、描画を担う leaf を列挙。各 leaf を分類：

- **primitive（信頼・刈る）**：`atoms`（shadcn 薄ラップ）由来、自前 story あり、汎用。→ カタログに載せない。
- **合成（検証対象）**：`organisms` / `pages` / `templates`（compose する `molecules` を含む）の compose。→ さらに次で分類。
  - **props駆動**：`useContext` / 表示制御 hook を内部で呼ばず props で受ける → ②gen で即 story 化
  - **hook/context結合**：React context・表示制御 hook に依存 → ②gen で decorator/stub 必要（結合先を明記）。データ取得/server action に依存する場合は本来 app 層の責務なので、presentational 分割の候補として備考に残す。

### 2. 状態を洗い出す（描画差のみ）

各合成 leaf について、**画面上で描画が変わる状態**を列挙（該当するものだけ）。内部分岐や実装値は状態にしない。

- バリアント（種別違い）/ データ有無（空状態）/ 処理状態 / 権限 / デバイス(Desktop↔Mobile) / ローディング / エラー / 編集中

各状態に **期待値marker（その状態で画面に出るべき文言・要素を1つ）を仕様から**引く。実装から引かない。

### 3. カタログを出力する

`docs/qa/catalogs/<target-slug>.md`（無ければ作成）に以下を出す。これが積み上がる**資産**。

```markdown
# 基準カタログ: <対象> (branch: <branch> / entry: <component path>)

## 信頼境界

- 刈った primitive: <一覧>（atoms 由来・信頼）
- 検証対象の合成: <一覧>（organisms / pages / templates / molecules）

## 状態カタログ

| コンポーネント  | 状態(story名候補) | 分類(props/結合) | 結合先              | 期待値marker(文言/要素) | markerの出所    | カバー(✓/未) | 備考        |
| --------------- | ----------------- | ---------------- | ------------------- | ----------------------- | --------------- | ------------ | ----------- |
| ProfileLinkList | Default           | props            | -                   | リンク行が表示される    | Figma:node      | 未           |             |
| ProfileLinkList | Empty             | props            | -                   | 「リンクがありません」  | 文言定数        | 未           |             |
| PlayersPage     | Loading           | 結合             | usePlayers(context) | スケルトンが表示される  | 実装文言※要確認 | 未           | decorator要 |
```

- markerの出所が「実装」しか書けない状態は **※仕様確認** を付ける（スモークにしかならないと明示）
- decorator/stub コストが高い結合 leaf も**落とさず**カタログに載せ、備考に「decorator要」

## 出力（後続に渡すもの）

- カタログ md のパス
- 「②gen ですぐ着手できる props駆動状態」と「decorator/stub が要る結合状態」の区別
- ※仕様確認が必要な marker の一覧

## やらないこと

- primitive（atoms）の状態は洗い出さない（信頼して刈る）
- 期待値を実装から作らない（仕様から。無ければ※仕様確認）
- story/コードはここでは書かない（②gen の担当）
