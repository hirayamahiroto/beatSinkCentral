import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormField } from "./index";
import { Input } from "@ui/design-system/components/atoms/Input";

const meta = {
  title: "molecules/FormField",
  component: FormField,
  parameters: {
    docs: {
      description: {
        component:
          "ラベル・入力欄・補助テキスト（ヒント / エラー）を 1 つのフィールドとしてまとめる molecule。" +
          "利用側は `label` と children（Input 等）を渡すだけでよく、`htmlFor` を起点に Label と入力欄の紐付け、`aria-invalid` / `aria-describedby` によるエラー連携が自動で行われる。" +
          "フォームを構成する 1 行分の責務（『何を入力させたいか』『その入力の状態をどう伝えるか』）を一箇所にまとめることを目的とする。",
      },
    },
  },
} satisfies Meta<typeof FormField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "アカウントID",
    htmlFor: "accountId",
    children: <Input placeholder="例: dj_taro_123" />,
  },
  parameters: {
    docs: {
      description: {
        story:
          "ラベルと入力欄の最小構成。ヒントもエラーも無く、見た目だけ揃えたい場面に使う。",
      },
    },
  },
};

export const WithHint: Story = {
  args: {
    label: "アカウントID",
    htmlFor: "accountId",
    hint: "英数字とアンダースコア(_)、1〜255文字。後から変更できません",
    children: <Input placeholder="例: dj_taro_123" />,
  },
  parameters: {
    docs: {
      description: {
        story:
          "入力規則・補足情報をヒントとして添えるパターン。" +
          "ヒントは `aria-describedby` で入力欄に紐付き、スクリーンリーダーが入力欄と一緒に読み上げる。",
      },
    },
  },
};

export const WithError: Story = {
  args: {
    label: "アカウントID",
    htmlFor: "accountId",
    error: "英数字とアンダースコア(_)のみ使用できます",
    children: <Input defaultValue="invalid value!" />,
  },
  parameters: {
    docs: {
      description: {
        story:
          "バリデーションエラー時のパターン。" +
          "エラーが渡されるとヒントは表示されず、`aria-invalid` が立ち、エラー文が `aria-describedby` で入力欄に紐付く。",
      },
    },
  },
};
