import type { Meta, StoryObj } from "@storybook/react-vite";
import { CardHeader } from "./index";

const meta = {
  title: "atoms/Card/Header",
  component: CardHeader,
  parameters: {
    docs: {
      description: {
        component:
          "Card 上部のヘッダー領域を表す atom。タイトルと説明（CardTitle / CardDescription）を 1 つの塊としてまとめる責務を持つ。" +
          "Card 全体の中で『この Card が何を扱っているか』を最初に伝える区画として使う。",
      },
    },
  },
} satisfies Meta<typeof CardHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Card Header",
  },
};
