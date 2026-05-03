import type { Meta, StoryObj } from "@storybook/react-vite";
import { Link } from "./index";

const meta = {
  title: "atoms/Link",
  component: Link,
  parameters: {
    docs: {
      description: {
        component:
          "ページ間・セクション間の遷移を表現する atom。" +
          "`disabled` を立てると href が外れ、クリックも無効化、キーボードフォーカスからも外れる。" +
          "本文中の遷移やナビゲーションのリンク表現に使う。" +
          'ボタンの形でリンクを見せたい場面では Button の `variant="link"` を使う（操作としての強調が必要な遷移の場合）。',
      },
    },
  },
} satisfies Meta<typeof Link>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    href: "/",
    children: "Link",
  },
};

export const Disabled: Story = {
  args: {
    href: "/",
    disabled: true,
    children: "無効なリンク",
  },
  parameters: {
    docs: {
      description: {
        story:
          "遷移先が一時的に存在しない・権限がないなど、リンクとしての意味は残しつつクリックさせたくない状態。" +
          "`aria-disabled` と `tabIndex=-1` でフォーカスからも外れる。",
      },
    },
  },
};
