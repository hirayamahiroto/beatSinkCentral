# Storybook ストーリー作成方針

## 基本方針

- **コンポーネント単体を対象**とする。不要な依存は持ち込まない
- 振る舞いのテスト（`play` 関数）は書かない
- 振る舞いしか持たないコンポーネントもストーリーは作成するが、UI として表示されなくてよい
- 親コンポーネントが必要な場合のみ、ラッパーをストーリーファイル内に定義する

## UIコンポーネントのテストについて

コンポーネントは shadcn/ui・Radix UI などの OSS をベースとしており、品質は OSS 側で保証されている。そのため、**このプロジェクトではテストは特段記述しない**。品質保証は OSS 側に委ねる。

---

## ストーリーの種類

### UI ストーリー（見た目）

コンポーネントのバリアントや状態を `args` で切り替えて表示する。

```tsx
// atoms/Button/index.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./index";

const meta = {
  title: "atoms/Button",
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "default",
    children: "Button",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost Button",
  },
};
```

### 振る舞いのみのコンポーネント

UI として表示するものがない場合も、ストーリーファイル自体は作成する。
空の `Default` ストーリーで問題ない。

```tsx
// atoms/SomeProvider/index.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { SomeProvider } from "./index";

const meta = {
  title: "atoms/SomeProvider",
  component: SomeProvider,
} satisfies Meta<typeof SomeProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
```

---

## 親コンポーネントが必要な場合

コンポーネント単体では表示できない場合（複合コンポーネントなど）は、**ストーリーファイル内にラッパーを定義**する。

- `decorators` や外部プロバイダーは本当に必要な場合のみ使用する
- ラッパーはそのストーリーファイル内に閉じて定義し、共通化しない

```tsx
// atoms/Select/Content/index.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "../index";
import { SelectTrigger } from "../Trigger";
import { SelectValue } from "../Value";
import { SelectContent } from "./index";
import { SelectItem } from "../Item";

// SelectContent は Select をルートに必要とするため、ラッパーを定義
const SelectContentDemo = () => (
  <Select>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Select..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="a">Item A</SelectItem>
      <SelectItem value="b">Item B</SelectItem>
    </SelectContent>
  </Select>
);

const meta = {
  title: "atoms/Select/Content",
  component: SelectContentDemo,
} satisfies Meta<typeof SelectContentDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
```

---

---

## やらないこと

- 不要な `decorators` の追加（テスト対象外の責務を持ち込まない）
- ストーリーをまたいだラッパーの共通化（ファイル内に閉じる）
- `play` 関数による振る舞いテスト
