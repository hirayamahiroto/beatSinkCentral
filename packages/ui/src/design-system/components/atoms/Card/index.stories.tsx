import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "./index";
import { Typography } from "@ui/design-system/components/atoms/Typography";
import { Button } from "@ui/design-system/components/atoms/Button";

const meta = {
  title: "atoms/Card",
  component: Card,
  parameters: {
    docs: {
      description: {
        component:
          "関連する情報をひとまとまりに見せる glass morphism コンテナ。ダークな背景に重ねると自然に浮き上がり、メインの情報単位（プロフィール表示・設定セクション・通知ブロック等）を区切るのに使う。" +
          "文脈を持つ容器。中身の縦リズム・余白を Card 自身が所有する。ヘッダー / 本文 / フッターを明示的に区切りたい場合は `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter` を組み合わせて構造化する。" +
          '`gap` で内部の縦リズムを切り替える（既定 `sm`）。画像コンテナのように余白そのものが要らない場合は `gap="none"` で opt-out する。' +
          '`<Card><Stack gap="md">…</Stack></Card>` のように内側を Stack で包んで構造を外注しない。Card 自身の `gap` で表現する。',
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Typography variant="small">ログイン中のアカウント</Typography>
        <Typography variant="p">example@gmail.com</Typography>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "推奨される使い方。ラベルと値のような密に関係する 2 行を、Card の標準 gap (`sm`) でそのまま並べる。",
      },
    },
  },
};

export const WithGapMd: Story = {
  args: {
    children: (
      <>
        <Typography variant="h3">アカウント設定</Typography>
        <Typography variant="p">
          登録メールアドレス: user@example.com
        </Typography>
        <Button variant="default">変更を保存</Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "見出し・本文・アクションのように役割の異なる要素を並べる時に使う中間の余白。" +
          "`sm` よりゆとりがあり、要素が独立した意味を持つことを視覚的に伝える。",
      },
    },
  },
};

export const WithGapNone: Story = {
  args: {
    children: (
      <div className="aspect-video w-full bg-gradient-to-br from-blue-500/40 to-purple-500/40" />
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "画像コンテナのように、padding も内部の縦リズムも要らないケースの opt-out。" +
          '`gap="none"` に加えて `p-0 overflow-hidden` を className で上書きする（後者がないと角丸からコンテンツがはみ出す）。',
      },
    },
  },
};
