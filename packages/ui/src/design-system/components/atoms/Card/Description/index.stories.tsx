import type { Meta, StoryObj } from "@storybook/react-vite";
import { CardDescription } from "./index";

const meta = {
  title: "atoms/Card/Description",
  component: CardDescription,
  parameters: {
    docs: {
      description: {
        component:
          "CardTitle を補足する説明文。タイトルだけでは伝えきれない目的・背景・補助情報を、控えめなトーンで添える責務を持つ。" +
          "CardHeader の中で CardTitle の直後に置くのが基本。",
      },
    },
  },
} satisfies Meta<typeof CardDescription>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Card description text",
  },
};
