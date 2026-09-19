import type { Meta, StoryObj } from "@storybook/react-vite";
import { PresentationPatternSelector } from "./index";

const options = [
  { code: "interview", label: "インタビュー" },
  { code: "zoom_dive", label: "ズーム" },
  { code: "spotlight", label: "スポットライト" },
  { code: "editorial", label: "特集記事" },
];

const meta = {
  title: "organisms/PresentationPatternSelector",
  component: PresentationPatternSelector,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "ダッシュボードでコンセプトページの表現パターンを選ぶ organism。選択肢のラベルは DB マスタ由来で props から受け取り、選択の保存は呼び出し側に委ねる。",
      },
    },
  },
} satisfies Meta<typeof PresentationPatternSelector>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unselected: Story = {
  args: {
    options,
    selectedCode: null,
    previewHref: "/players/saku/concept",
    isLoading: false,
    error: null,
    onSelect: () => {},
  },
};

export const Selected: Story = {
  args: { ...Unselected.args, selectedCode: "spotlight" },
};

export const Saving: Story = {
  args: { ...Selected.args, isLoading: true },
};

export const WithError: Story = {
  args: {
    ...Selected.args,
    error: "表現パターンの保存に失敗しました",
  },
};
