import type { Meta, StoryObj } from "@storybook/react-vite";
import { CardTitle } from "./index";

const meta = {
  title: "atoms/Card/Title",
  component: CardTitle,
  parameters: {
    docs: {
      description: {
        component:
          "Card の主題を 1 行で示すタイトル要素。Card の中で最も目を引く位置に置き、『この Card が何の情報か』を端的に伝える責務を持つ。" +
          "通常は CardHeader の中で CardDescription とペアにして使う。",
      },
    },
  },
} satisfies Meta<typeof CardTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Card Title",
  },
};
