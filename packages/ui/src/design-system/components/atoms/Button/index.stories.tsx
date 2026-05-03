import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./index";
import { Icon } from "@ui/design-system/components/atoms/Icon";

const meta = {
  title: "atoms/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          "操作の起点となるアクションを表す atom。`variant` で操作の重要度・性質を、`size` で密度を切り替える。" +
          "default はブランドの青→紫グラデーションが当たる主要 CTA で、1 画面につき原則 1 つだけ使う。" +
          "副次的な操作は outline / secondary / ghost / link を選んで主役を譲る。",
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "default",
    children: "プロフィールを作成",
  },
  parameters: {
    docs: {
      description: {
        story:
          "ブランドのグラデーションを当てる主要 CTA。ページや画面で最も重要な 1 操作（フォーム送信・新規作成・申込確定など）に使用する。" +
          "同列に複数置く場合は他 variant に弱めて主従を明確にする。",
      },
    },
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "削除する",
  },
  parameters: {
    docs: {
      description: {
        story:
          "破壊的な操作（削除・退会・取り消しなど）に使用する。" +
          "ユーザーの作業を失わせ得る操作には確認ダイアログ等を併用すること。",
      },
    },
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "キャンセル",
  },
  parameters: {
    docs: {
      description: {
        story:
          "枠線だけの控えめな表現。Primary と並ぶときの『戻る / キャンセル』など、" +
          "否定的ではないが主役を譲る操作に使用する。",
      },
    },
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "下書き保存",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Primary と一緒に並ぶ補助的な操作に使用する。" +
          "Outline より存在感があり、Ghost より目立つ中間の強度。",
      },
    },
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "もっと見る",
  },
  parameters: {
    docs: {
      description: {
        story:
          "背景・枠線を持たない最も控えめな表現。" +
          "ナビゲーション内のアイテムや、密度高く並ぶ補助操作に使用する。",
      },
    },
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    children: "詳しく見る",
  },
  parameters: {
    docs: {
      description: {
        story:
          "テキストリンクの形で見せたいボタン。" +
          "本文中の遷移ではなく、操作としてのリンクが必要なケースに限って使う（本文中のリンクは Link atom を使用する）。",
      },
    },
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    children: "Save",
  },
  parameters: {
    docs: {
      description: {
        story:
          "密度の高い UI（テーブル内のアクション、フィルタチップ的な操作など）に使用する小サイズ。",
      },
    },
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    children: "Get started",
  },
  parameters: {
    docs: {
      description: {
        story: "ヒーローセクション等、画面の主役級 CTA に使用する大サイズ。",
      },
    },
  },
};

export const IconOnly: Story = {
  args: {
    size: "icon",
    variant: "ghost",
    "aria-label": "閉じる",
    children: <Icon name="X" />,
  },
  parameters: {
    docs: {
      description: {
        story:
          "アイコンのみのボタン。文字情報がないため `aria-label` で操作の意味を必ず補う。",
      },
    },
  },
};

export const WithLeadingIcon: Story = {
  args: {
    children: (
      <>
        <Icon name="Play" />
        再生する
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "アイコン + テキストの組み合わせ。サイズや揃えは Button 側が引き受けるので、Icon に個別の見た目指定をしなくてよい。",
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "送信中...",
  },
  parameters: {
    docs: {
      description: {
        story:
          "操作不可の状態。" +
          "送信中やバリデーション未充足など、操作できない理由が画面上の他要素から伝わる前提で使う。",
      },
    },
  },
};
