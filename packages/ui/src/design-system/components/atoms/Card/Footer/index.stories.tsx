import type { Meta, StoryObj } from "@storybook/react-vite";
import { CardFooter } from "./index";

const meta = {
  title: "atoms/Card/Footer",
  component: CardFooter,
  parameters: {
    docs: {
      description: {
        component:
          "Card の末尾でアクション（ボタン・リンク・補助操作）を横並びに集約する領域。" +
          "Card の主たる目的に対する『次に取るべき行動』をまとめて提示する責務を持つ。",
      },
    },
  },
} satisfies Meta<typeof CardFooter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Card Footer",
  },
};
