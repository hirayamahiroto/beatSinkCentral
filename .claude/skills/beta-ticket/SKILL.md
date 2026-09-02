---
name: beta-ticket
description: 「知る → 応援する」検証ベータ（統合 Issue #270）の sub-issue を実装するときの作業レール。sub-issue（T00〜T14）に着手する前に読む。チケットの読み込み → 契約確認 → 実装 skill への接続 → gate → PR 連携の手順を固定する。
---

# ベータチケット実装レール

## このスキルの目的

**「チケット（Issue）と計画を読まずに実装を始めてしまう」「PR と Issue の紐づけが切れて進捗が見えなくなる」ことを防ぐ。**

このベータの作業は 3 か所に分担して置かれている。どれか 1 つだけ読んで着手すると事故る。

| 情報                              | 正本                                                       |
| --------------------------------- | ---------------------------------------------------------- |
| 検証の定義（何のための実装か）    | `docs/discussions/prd/know-to-support-verification/prd.md` |
| 実行計画・粒度規約・PR 分割・依存 | `docs/plans/know-to-support-beta/plan.md`                  |
| このチケットの受け入れ条件と状態  | sub-issue 本文（`gh issue view <N>`）                      |

> **このファイルは規範ではない。** 設計規範は `docs/product/` と `docs/architecture/`、実装手順の規範は `api-server-feature` / `frontend-feature` skill にある。ここには重複させない。

## 使うタイミング

統合 Issue [#270](https://github.com/hirayamahiroto/beatSinkCentral/issues/270) 配下の sub-issue（#255〜#269）に着手するとき。

## 手順

### Step 0: チケットと計画を読む

1. `gh issue view <N>` で sub-issue 本文を読む（背景・スコープ・受け入れ条件・「着手前に決めること」）
2. `docs/plans/know-to-support-beta/plan.md` で依存と PR 分割を確認する
   - 依存先チケットが未完了なら着手しない（ユーザーに報告する）
   - L チケット（T04/T05/T08）は「今回のセッションはどの PR か」を先に確定する
3. **「着手前に決めること」に未決があれば、実装せずユーザーに確認する**。特に T00（#255）が未完了の間、T01 以降は着手できない

### Step 1: 契約を凍結する

- このチケットが満たす UI 契約を `AudienceArtistProfile` の props（`packages/ui/src/design-system/components/organisms/AudienceArtistProfile/index.tsx`）と PRD 該当節で確認する
- 契約と Issue の受け入れ条件がズレていたら、直さずユーザーに共有する

### Step 2: 実装 skill に接続する

- DB スキーマ・ドメイン・usecase・API に触れる → **`api-server-feature` skill を読み、その手順に従う**
- BFF・画面・UI コンポーネントに触れる → **`frontend-feature` skill を読み、その手順に従う**
- 両方に触れる PR は api-server 側から着手する（内側 → 外側）

### Step 3: gate を通す

コミット前に必ず: `tsc --noEmit` / lint / 対象テスト（`npm test -- --filter api-server` 等）。
受け入れ条件は「gate 全緑なら diff を読まずにマージできる」水準で満たすこと。満たせない条件が残るなら PR 本文に明記する。

### Step 4: PR と Issue を紐づける

- ブランチは sub-issue 単位（L チケットは PR 単位）で main から切る
- PR 本文: 中間 PR は `Refs #<N>`、チケットを閉じる最終 PR だけ `Closes #<N>`
- マージ後、Issue のチェック状態が #270 に自動集計される。手動での進捗転記はしない

## 止まるべき地点

- 「着手前に決めること」が未決のとき
- 設計規範（`docs/product/` / `docs/architecture/`）に無い判断が必要になったとき — コードに落とさず、ドキュメント側を整える方向で相談（CLAUDE.md の規約）
- 受け入れ条件を満たせない・削る必要が出たとき
