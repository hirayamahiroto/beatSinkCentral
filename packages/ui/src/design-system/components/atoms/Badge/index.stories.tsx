import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./index";

const meta = {
  title: "atoms/Badge",
  component: Badge,
  parameters: {
    docs: {
      description: {
        component:
          "短いラベル（タグ・状態・分類）を視覚的に区切って見せる atom。" +
          "ジャンルやステータスなど『一語〜数語のメタ情報』を並べる用途に使う。クリックして主要操作を起こすものには Button を使う。",
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Beatbox" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Loopstation" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "Bass" },
};
