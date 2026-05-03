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
          "子要素を縦方向に並べ、間隔を `gap` で指定するレイアウト atom。" +
          "文脈を持たない汎用 atom。generic atom（Typography / Button / Input など）を組み合わせて文脈を作る場面（organism / page）でレイアウト構造を定義する目的で使う。" +
          "`gap` で `sm` (8px) / `md` (16px) / `lg` (24px) を切り替える。`sm` は密接な要素（ラベル + 入力など）、`md` はカード内のセクション同士、`lg` はフォームのフィールド群やページ内のメジャー区切りが目安。" +
          "NG: Card / FormField のような『文脈を持つ容器』の内側を Stack で包む。文脈を持つ容器は自身で縦リズムを所有しているため、Stack を被せると構造が二重になる。",
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
