import type { Meta, StoryObj } from "@storybook/react-vite";
import { OfferEditor } from "./index";

const meta = {
  title: "organisms/OfferEditor",
  component: OfferEditor,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "ダッシュボードで次のライブ（オファー）を入力・差し替える organism。日付・場所・チケット URL・一言・共演者を 1 つのフォームで受け、保存の実処理は `onSubmit` で呼び出し側へ委ねる。`defaultValues` が null なら「まだオファーが無い」状態として登録文言で描画する。",
      },
    },
  },
  args: {
    onSubmit: (values) => console.log("submit", values),
  },
} satisfies Meta<typeof OfferEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    defaultValues: null,
    isLoading: false,
    error: null,
  },
};

export const WithOffer: Story = {
  args: {
    defaultValues: {
      date: "2026-09-20",
      place: "渋谷 WWW",
      ticketUrl: "https://tickets.example.com/e/1",
      comment: "この日は新曲を初めてやります",
      coPerformers: [
        { name: "Hana", handle: "hana_bb" },
        { name: "Ken", handle: "" },
      ],
    },
    isLoading: false,
    error: null,
  },
};

export const Saving: Story = {
  args: { ...WithOffer.args, isLoading: true },
};

export const WithError: Story = {
  args: {
    ...WithOffer.args,
    error: "Co-performer not found: hana_bb",
  },
};
