import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./index";

const meta = {
  title: "atoms/Label",
  component: Label,
  parameters: {
    docs: {
      description: {
        component:
          "フォーム要素（Input / Select 等）が何を求めているかをユーザーに伝える atom。" +
          "文脈を持たない汎用 atom。単独で使わず、必ず対応するフォーム要素とペアで配置する（ペア + a11y 連携を内部で自動化したい場合は FormField molecule を使う）。" +
          "`htmlFor` で対応するフォーム要素の `id` と紐付ける。これによりラベルクリックで入力欄にフォーカスが移り、スクリーンリーダーが対応関係を読み上げる a11y が成立する。" +
          "NG: `htmlFor` を省略して見た目だけのラベルとして使う。a11y が成立しないため、紐付けが面倒な場合は FormField を使う。",
      },
    },
  },
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    htmlFor: "input-id",
    children: "ラベルテキスト",
  },
};
