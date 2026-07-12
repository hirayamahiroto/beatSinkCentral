---
name: story-states-run
description: >-
  生成済みの story(＋play) を実行してレンダリングを検証し、証跡(UI=スクショ / フロー=動画・trace)を収集、
  pass/fail と coverage を出す skill。確定層(story描画+play, LLM stub の Playwright)は hard gate、
  非決定層(実LLM/視覚)は advisory として扱う。失敗時は triage が仕分けられる self-contained な failure bundle
  (どの状態/expected vs actual/失敗時スクショ/落ちたstep/使用fixture)を出す。story-states パイプラインの ③run ステージ。
  ユーザーが「storyを実行」「レンダリングチェック」「テスト回して証跡」「npm testで検証」等と言ったとき、
  または ②gen 後に実行・検証を求めたときに使う。失敗が出たら ④triage に渡す。
---

# story-states-run — story を実行し、証跡を集める（③run）

生成済み story を実行し、**確定的に「描画される＋期待markerが出る」ことを gate**、証跡（スクショ）を集め、coverage を更新する。

## このリポジトリの前提（beatSinkCentral）

- test runner は **Vitest**。root は `npm test`（= `turbo run test`）、個別は `cd packages/ui && npx vitest`。
- **未導入＝前提セットアップ**（現状は正直にこう扱う。無いものを有ると書かない）:
  - play を hard gate 化する `@storybook/addon-vitest`（＋ Storybook v10 test API）は**未導入**。導入前は「story が例外なく render される」までがスモーク gate。play アサートは導入後。
  - フロー/E2E の Playwright は**未整備**。継ぎ目・複数画面フローは現状スコープ外（将来）。
- 導入方針・段取りは評価設計 `docs/qa/story-states-eval.md` に集約。

## 確定層と非決定層（扱いを混ぜない）

| 実行                                             | 性質     | 扱い                                 | 現状                       |
| ------------------------------------------------ | -------- | ------------------------------------ | -------------------------- |
| story render（Vitest, chromium headless）        | 確定     | **hard gate**                        | 稼働（例外検出のスモーク） |
| story render + play（`@storybook/addon-vitest`） | 確定     | **hard gate**                        | 基盤未導入（導入後に有効） |
| Playwright（LLM/外部を stub）                    | ほぼ確定 | gate                                 | 未整備（将来）             |
| Playwright（実LLM/本番）                         | 非決定   | 不変条件のみ＋**動画は証跡**         | 未整備（将来）             |
| 視覚diff / VLM judge                             | 非決定   | **advisory**（落とさない・人が見る） | 任意                       |

## 入力

- ②gen が生成した story/fixture のパス、対象は `packages/ui`
- 実行スコープ（対象 story のみ / 全体）

## 手順

### 1. 実行

- **UI**：`cd packages/ui && npx vitest`（対象を絞るなら `-- <path>`）。各 story を描画し例外・（導入済みなら）play失敗を検出。
- lint/typecheck/format は pre-commit で担保済み。ここは描画・挙動に集中。

### 2. 証跡（evidence）を集める

- **UI**：各 story のスクショ（pass も含め状態の証跡として保存）
- 証跡は「正解」ではなく**証跡**（人が後で見る用）。視覚を正解判定に使う場合のみ baseline/Figma と比較する advisory を別途回す。

### 3. pass / fail を判定し、failure bundle を作る

失敗した story ごとに、④triage が実装を読み直さず判断できる **self-contained bundle** を出す：

- 対象コンポーネント・状態(story名)
- **expected（カタログのmarker）vs actual（実際のDOM/文言）**
- 失敗時スクショ（と、あれば直前の正常スクショ）
- 落ちた play/step、使用した fixture の値
- 実行計器（Vitest render / addon-vitest / Playwright）

### 4. coverage と評価台帳を更新する

- **coverage**：`docs/qa/catalogs/<target-slug>.md` のカバー列を `✓/未/失敗` で更新（①map が作った同じ catalog を上書き更新）。
- **実行サマリ・failure bundle**：`docs/qa/reports/<target-slug>.md` に（対象/branch/計器を冒頭、末尾に **pass/fail 件数・gate結果・advisory指摘数**）。
- **評価台帳**：各 story の実行結果を 1 行、append-only 台帳 `docs/qa/story-states-ledger.md` に追記（スキーマは `docs/qa/story-states-eval.md`）。これが Red精度 / Drift率 / churn 等の指標の素になる。

## 出力

- pass/fail サマリ（gate は緑/赤を明示。未導入 gate はスモーク到達までを明示）
- failure bundle 一式（赤があれば ④triage へ）
- 証跡（スクショ）のパス、更新した coverage・台帳のパス

## やらないこと

- 非決定層(実LLM/視覚)を gate にしない（advisory）
- 未導入の基盤を「有る」ものとして緑扱いしない（スモーク到達を正直に報告）
- 失敗を握りつぶさない。必ず bundle 化して ④triage に渡す
- 期待値の妥当性判断（それは ④triage）。ここは「実行と証跡収集」に徹する
