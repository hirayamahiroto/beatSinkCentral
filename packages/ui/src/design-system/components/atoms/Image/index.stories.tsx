import type { Meta, StoryObj } from "@storybook/react-vite";
import { Image } from "./index";

const meta = {
  title: "atoms/Image",
  component: Image,
  parameters: {
    docs: {
      description: {
        component:
          "画像を表示し、ビューポートに入るまで読み込みを遅延させる atom。lazy loading によりリスト表示や長いページでの初回読み込み負荷を抑える。" +
          "文脈を持たない汎用 atom。サイズ・配置は呼び出し側で与える前提で使う。" +
          '`src` / `alt` を中心とした薄いラッパー。`alt` は必須で、装飾目的の画像は空文字 `""` を明示的に渡す（属性自体を省略しない）。',
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
