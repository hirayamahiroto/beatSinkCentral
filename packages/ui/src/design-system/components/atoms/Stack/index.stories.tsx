import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "./index";

const meta = {
  title: "atoms/Stack",
  component: Stack,
  parameters: {
    docs: {
      description: {
        component:
          "子要素を縦方向に並べ、間隔を `gap` で指定するレイアウト atom。`className` は受け付けず、新しい間隔が必要になったら gap を追加して対応する。",
      },
    },
  },
} satisfies Meta<typeof Stack>;

export default meta;

type Story = StoryObj<typeof meta>;

const Item = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded border bg-muted px-3 py-2 text-sm">{children}</div>
);

export const Sm: Story = {
  args: {
    gap: "sm",
    children: (
      <>
        <Item>Item A</Item>
        <Item>Item B</Item>
        <Item>Item C</Item>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          '`gap="sm"` (8px)。Label と入力欄、エラーメッセージなど密接した要素の縦積みに使用する。',
      },
    },
  },
};

export const Md: Story = {
  args: {
    gap: "md",
    children: (
      <>
        <Item>Item A</Item>
        <Item>Item B</Item>
        <Item>Item C</Item>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: '`gap="md"` (16px)。Card 内のセクション同士の縦積みに使用する。',
      },
    },
  },
};

export const Lg: Story = {
  args: {
    gap: "lg",
    children: (
      <>
        <Item>Item A</Item>
        <Item>Item B</Item>
        <Item>Item C</Item>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          '`gap="lg"` (24px)。フォームのフィールド群やページ内のメジャー区切りに使用する。',
      },
    },
  },
};
