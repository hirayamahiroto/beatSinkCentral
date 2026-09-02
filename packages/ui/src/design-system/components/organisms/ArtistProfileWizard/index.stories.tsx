import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArtistProfileWizard } from "./index";

const meta = {
  title: "organisms/ArtistProfileWizard",
  component: ArtistProfileWizard,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "アーティストプロフィールを登録するステップ式フォーム organism。" +
          "情報の塊ごと（基本 / Story / 活動 / リンク / 確認）にステップを分け、進捗の可視化・ステップ単位のバリデーション・途中保存・公開設定までを 1 つのフローとして担う。" +
          "Story は『問い起点』で新人でも書ける構成にしている。送信・下書き保存・画像アップロードの実処理は持たず、`onSubmit` / `onSaveDraft` / `onUploadImage` で呼び出し側へ委譲する。",
      },
    },
  },
  args: {
    linkTypeOptions: [
      { type: "youtube", label: "YouTube" },
      { type: "x", label: "X" },
      { type: "instagram", label: "Instagram" },
      { type: "tiktok", label: "TikTok" },
      { type: "other", label: "その他" },
    ],
    storyQuestions: [
      {
        code: "beginning",
        label: "なぜビートボックスを始めたのか",
        required: true,
      },
      { code: "turning_point", label: "転機になった出来事", required: false },
      { code: "concept", label: "何を表現したいのか", required: false },
    ],
    onSubmit: (data) => console.log("submit", data),
    onSaveDraft: (data) => console.log("draft", data),
    onUploadImage: async (file) => {
      console.log("upload", file.name);
      return URL.createObjectURL(file);
    },
  },
} satisfies Meta<typeof ArtistProfileWizard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    email: "saku@example.com",
    isLoading: false,
    error: null,
  },
};

export const Loading: Story = {
  args: {
    email: "saku@example.com",
    isLoading: true,
    error: null,
  },
};

export const WithError: Story = {
  args: {
    email: "saku@example.com",
    isLoading: false,
    error: "保存に失敗しました。時間をおいて再度お試しください。",
  },
};
