import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "./index";

const meta = {
  title: "atoms/Icon",
  component: Icon,
  parameters: {
    docs: {
      description: {
        component:
          "ホワイトリスト化された lucide-react アイコンを `name` で 1 つ選んで描画する atom。" +
          "文脈を持たない汎用 atom。色とサイズは親要素（Button / Typography 等）の `color` / `font-size` に追従するため、組み合わせ側がトーンを与える前提で使う。" +
          "`name` で表示するアイコンを切り替える。一部のアイコンには既定の振る舞いがカプセル化されており、たとえば `Loader2` は自動で回転アニメーション（`animate-spin`）が当たる。新しいアイコンが必要になったらホワイトリストに追加してから使う。" +
          "NG: lucide-react から直接 import して使う。プロジェクト内のアイコン体系が崩れるため、必ず Icon の `name` 経由で使う。",
      },
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "Play",
  },
  parameters: {
    docs: {
      description: {
        story:
          "基本的な使い方。`name` でアイコンを指定するだけで、サイズと色は親要素から継承する。",
      },
    },
  },
};

export const Loader: Story = {
  args: {
    name: "Loader2",
  },
  parameters: {
    docs: {
      description: {
        story:
          "ローディング表示用のアイコン。`Loader2` を選ぶと自動で回転アニメーションが当たるため、利用側で `animate-spin` を付ける必要がない。",
      },
    },
  },
};

export const InheritedColorAndSize: Story = {
  args: {
    name: "Star",
  },
  decorators: [
    (Story) => (
      <span className="text-yellow-400 text-3xl">
        <Story />
      </span>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "親要素の文字色・サイズを継承する例。Button や Typography の中に置いた時に自動でトーンが揃う挙動を示している。",
      },
    },
  },
};
