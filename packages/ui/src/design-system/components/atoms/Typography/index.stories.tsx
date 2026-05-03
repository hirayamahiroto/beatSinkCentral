import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Typography } from "./index";

const meta = {
  title: "atoms/Typography",
  component: Typography,
  parameters: {
    docs: {
      description: {
        component:
          "テキストの見た目を `variant` (構造) と `tone` (色) の 2 軸で指定する atom。`className` は受け付けず、新しい見た目が必要になったら variant/tone を追加して対応する。",
      },
    },
  },
} satisfies Meta<typeof Typography>;

export default meta;

type Story = StoryObj<typeof meta>;

export const H1: Story = {
  args: {
    variant: "h1",
    children: "Heading 1",
  },
  parameters: {
    docs: {
      description: {
        story: "ページ最上位の見出し。原則 1 ページに 1 つだけ使用する。",
      },
    },
  },
};

export const H2: Story = {
  args: {
    variant: "h2",
    children: "Heading 2",
  },
  parameters: {
    docs: {
      description: {
        story: "セクション見出し。ページ内のメジャーな区切りに使用する。",
      },
    },
  },
};

export const H3: Story = {
  args: {
    variant: "h3",
    children: "Heading 3",
  },
  parameters: {
    docs: {
      description: {
        story: "サブセクション見出し。H2 配下の小区切りに使用する。",
      },
    },
  },
};

export const H4: Story = {
  args: {
    variant: "h4",
    children: "Heading 4",
  },
  parameters: {
    docs: {
      description: {
        story: "小見出し。カード内のタイトルや、より細かい区切りに使用する。",
      },
    },
  },
};

export const Lead: Story = {
  args: {
    variant: "lead",
    children: "Lead paragraph text",
  },
  parameters: {
    docs: {
      description: {
        story:
          "導入文・ダイアログ説明など、本文より目立たせたい一段大きな文章 (20px)。",
      },
    },
  },
};

export const P: Story = {
  args: {
    variant: "p",
    children: "Body paragraph text (16px)",
  },
  parameters: {
    docs: {
      description: {
        story: "標準の本文段落 (16px)。フォームの値表示や説明文の既定。",
      },
    },
  },
};

export const Small: Story = {
  args: {
    variant: "small",
    children: "Small caption text (12px)",
  },
  parameters: {
    docs: {
      description: {
        story:
          "フォームのキャプション・ヒント・エラーメッセージなど補助的な文 (12px)。",
      },
    },
  },
};

export const Danger: Story = {
  args: {
    variant: "p",
    tone: "danger",
    children: "Error message",
  },
  parameters: {
    docs: {
      description: {
        story:
          '`tone="danger"` の表示例。バリデーションエラーや警告文に使用する。色だけが切り替わり、サイズ等は variant 側で決まる。',
      },
    },
  },
};
