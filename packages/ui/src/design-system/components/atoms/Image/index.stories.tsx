import type { Meta, StoryObj } from "@storybook/react-vite";
import { Image } from "./index";

const meta = {
  title: "atoms/Image",
  component: Image,
  parameters: {
    docs: {
      description: {
        component:
          "画像表示を担う atom。" +
          "lazy loading が組み込まれており、画像がビューポートに入るまで読み込みを遅延させる。これによりリスト表示や長いページでの初回読み込み負荷を抑える責務を持つ。" +
          '`alt` は画像の意味を伝えるテキストとして必ず指定する（装飾目的で意味を持たない画像なら空文字 `""` を明示的に渡す）。',
      },
    },
  },
} satisfies Meta<typeof Image>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    src: "/image1.jpeg",
    alt: "",
  },
};
