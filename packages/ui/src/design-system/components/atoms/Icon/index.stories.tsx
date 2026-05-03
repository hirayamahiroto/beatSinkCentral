import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "./index";

const meta = {
  title: "atoms/Icon",
  component: Icon,
  parameters: {
    docs: {
      description: {
        component:
          "プロジェクトで使えるアイコンを `name` で 1 つ選んで描画する atom。" +
          "lucide-react から事前にホワイトリスト化したアイコンだけを公開することで、利用箇所のアイコン体系を制約する責務を持つ。" +
          "色やサイズは親要素の文字色・フォントサイズに追従する（Button や Typography の中に置けば自動で揃う）。" +
          "特定のアイコンには既定の振る舞いが紐付いており、たとえば `Loader2` は自動で回転アニメーション（`animate-spin`）が当たる。",
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
