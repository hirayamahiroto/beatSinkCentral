---
name: story-states-gen
description: >-
  基準カタログ(状態×期待値marker)を入力に、各状態を「1状態=1 named story」として CSF v3 の Storybook story と
  fixture を生成する skill。provenance を厳格に分離する: fixture(props/データ) は実装の型から、期待値(play アサート)は
  仕様(カタログのmarker)から。props駆動は即生成、hook/context結合は decorator/stub(またはpresentational分割の提案)で対応。
  story-states パイプラインの ②gen ステージ。ユーザーが「storyを生成」「fixtureとstoryを作って」「カタログからstory化」
  等と言ったとき、または ①map のカタログを渡して story 生成を求めたときに使う。①map の後、③run の前に走る。
---

# story-states-gen — カタログから story+fixture を生成する（②gen）

基準カタログ（①map の出力）を、house-style の Storybook story と fixture に変換する。
**このステージの唯一かつ最重要のルールは provenance 分離**：

- **fixture（Input／props・データ）← 実装の型から**（propsの形は実装が正）
- **期待値（play アサート）← 仕様から**（カタログの marker。実装の分岐を写経しない）

同じ AI が両方を実装から作ると「コードがコード通り動く」しか言えない（循環）。fixture だけ実装に合わせ、期待値はカタログの marker を転写する。

## 入力

- ①map が出した基準カタログ md のパス
- 対象は `packages/ui`（このリポジトリで Storybook があるのはここだけ）

## house style（厳守）

- **workspace は `packages/ui` のみ**。`apps/beatfolio` には Storybook が無い。
- **import**：`import type { Meta, StoryObj } from '@storybook/react-vite'`（このリポジトリの既存 story と統一。`@storybook/react` は使わない）
- **CSF v3**：`const meta = {...} satisfies Meta<typeof C>` → `export default meta` → `type Story = StoryObj<typeof meta>`
- **1状態=1 named export**、`render: () => JSX`（args トグルで畳まない）
- title は `'<kind>/<Component>'`（kind = `atoms`|`molecules`|`organisms`|`pages`|`templates`。例 `'organisms/ProfileLinkList'` / `'pages/PlayersPage'`）
- story はコンポーネントディレクトリに **`index.stories.tsx` として colocate**（既存踏襲）
- **デザイントークン厳守**（story 内の補助 markup も `bg-background` / `bg-card` / `text-foreground` / `text-muted-foreground` / `border-border` / `bg-primary` / `bg-secondary` / `destructive`。アドホックな色 `bg-lime-400` 等を直書きしない）
- **実装コメント無し**（状態の意味は story 名で表す）
- fixture は同ディレクトリの `index.fixtures.ts` か `__fixtures__/` に。`null` と「取得済み空」を取り違えない

## 手順

### A. props駆動コンポーネント（即生成）

fixture を props に渡し、状態ごとに named export を作る。

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProfileLinkList } from "./index";
import { profileLinks } from "./index.fixtures";

const meta = {
  title: "organisms/ProfileLinkList",
  component: ProfileLinkList,
} satisfies Meta<typeof ProfileLinkList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ProfileLinkList links={profileLinks} />,
};

export const Empty: Story = {
  render: () => <ProfileLinkList links={[]} />,
};
```

### B. hook/context結合コンポーネント（優先順で対処）

`packages/ui` は Next 非依存が規範。データ取得 hook / server action / `next/*` に依存する leaf は、本来 app 層（apps/beatfolio）の責務が混ざっているので、まず 1（分割）を検討する。

1. **presentational 分割の提案**：取得と描画が混在する leaf は、描画部を props 受けの内部コンポーネントに切り出せないか検討。切り出せるならそれを story 化。**範囲外の分割は勝手に行わず提案に留める**。
2. **decorator で依存供給**：
   - React context → mock provider decorator に fixture を流す（無ければこの skill が最初の雛形を作る）
   - 表示制御 hook（純粋な UI 状態）→ props で受ける形へ寄せる（1 の分割）か、hook 注入化
3. decorator/stub コストが高い leaf は **story化せず、③run に渡す前にカタログの備考へ「未生成・理由」を残す**（黙って落とさない）

### C. 期待値（play）の付与 — 仕様から転写

「描画される」以上を確認する状態には play を付ける。**アサート内容はカタログの marker（仕様由来）**。

> 前提：play を実行・gate 化する基盤（`@storybook/addon-vitest` と Storybook v10 の test API）は**このリポジトリに未導入**。導入前は play を書かず render-only（スモーク）に留め、③run のレポートに「gate 基盤未導入・スモークのみ」と残す。導入手順と正確な import はセットアップ時に Storybook v10 のドキュメントで確認する（→ 評価設計 `docs/qa/story-states-eval.md`）。

導入後の play の形（アサートはカタログ marker 由来）：

```tsx
export const Empty: Story = {
  render: () => <ProfileLinkList links={[]} />,
  play: async ({ canvasElement }) => {
    // marker はカタログ(仕様)由来。実装の文言を後追いで写経しない
    // expect(within(canvasElement).getByText('リンクがありません')).toBeVisible()
  },
};
```

marker の出所が「実装」なカタログ行（※仕様確認）は、play を付けず render のみ（スモーク扱い）にし、③run のレポートに「スモークのみ・要仕様確認」と残す。

## 出力

- 生成した `index.stories.tsx` / `index.fixtures.ts` のパス一覧
- カタログの各状態を「story生成済(play有/render only) / 未生成(理由)」に更新
- presentational 分割の提案（あれば）

## やらないこと

- 期待値を実装から作らない（provenance 分離）
- primitive（atoms）の story は作らない（①map で刈り済み）
- 実行・スクショ取得はしない（③run の担当）
