import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArtistProfile } from "./index";

const meta = {
  title: "organisms/ArtistProfile",
  component: ArtistProfile,
  parameters: {
    docs: {
      description: {
        component:
          "アーティストプロフィールを作成するためのフォーム organism。" +
          "ログイン中のメールアドレスを表示しつつ、アカウント ID の入力を受け付け、バリデーション結果に応じてエラー表示と送信制御を行う責務を持つ。" +
          "入力欄は `FormField` molecule を使い、a11y 紐付けとエラー表示が組み込まれた状態で組み立てる。",
      },
    },
  },
  args: {
    onSubmit: (data) => {
      console.log("submitted", data);
    },
  },
} satisfies Meta<typeof ArtistProfile>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    email: "user@example.com",
    isLoading: false,
    error: null,
  },
};

export const Loading: Story = {
  args: {
    email: "user@example.com",
    isLoading: true,
    error: null,
  },
};

export const WithError: Story = {
  args: {
    email: "user@example.com",
    isLoading: false,
    error: "このアカウントIDは既に使用されています",
  },
};

export const LongEmail: Story = {
  args: {
    email: "very-long-email-address-for-overflow-test@subdomain.example.com",
    isLoading: false,
    error: null,
  },
};
