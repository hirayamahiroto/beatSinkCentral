import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProfilePublishControl } from "./index";

const meta = {
  title: "organisms/ProfilePublishControl",
  component: ProfilePublishControl,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "ダッシュボードでプロフィールの公開状態を示し、公開 / 非公開を切り替える organism。" +
          "公開可能条件の判定はドメイン（ensurePublishable）が持ち、本コンポーネントは" +
          "BFF で表示ラベルへ解決済みの不足項目を受け取って提示するだけに留める。",
      },
    },
  },
} satisfies Meta<typeof ProfilePublishControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Published: Story = {
  args: {
    published: true,
    missingRequirements: [],
    isLoading: false,
    error: null,
    onPublish: () => {},
    onUnpublish: () => {},
  },
};

export const Publishable: Story = {
  args: {
    ...Published.args,
    published: false,
  },
};

export const MissingRequirements: Story = {
  args: {
    ...Published.args,
    published: false,
    missingRequirements: ["アーティスト写真", "SNS / 配信リンク"],
  },
};

export const Failed: Story = {
  args: {
    ...Published.args,
    published: false,
    error: "プロフィールの公開に失敗しました",
  },
};
