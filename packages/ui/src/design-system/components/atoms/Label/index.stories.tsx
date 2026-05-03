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
          "`htmlFor` で対応するフォーム要素の `id` と紐付けることで、ラベルクリックで入力欄にフォーカスが移る・スクリーンリーダーが入力欄とラベルの対応を読み上げる、というアクセシビリティを成立させる責務を持つ。" +
          "単独で使わず、必ず対応するフォーム要素とペアで配置する。",
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
