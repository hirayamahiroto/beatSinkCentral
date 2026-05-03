import type { Meta, StoryObj } from "@storybook/react-vite";
import { CardContent } from "./index";

const meta = {
  title: "atoms/Card/Content",
  component: CardContent,
  parameters: {
    docs: {
      description: {
        component:
          "Card の本文ブロックを担う領域。CardHeader の下にメインのコンテンツ（説明本文・データ表示・フォーム本体など）を配置する責務を持つ。" +
          "CardHeader / CardFooter と並ぶ Card の主要セクションのひとつ。",
      },
    },
  },
} satisfies Meta<typeof CardContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Card content area",
  },
};
