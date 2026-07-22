import type { Meta, StoryObj } from "@storybook/react-vite";
import { PublicArtistProfile } from "./index";

const meta = {
  title: "organisms/PublicArtistProfile",
  component: PublicArtistProfile,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "公開されたアーティストプロフィールを閲覧者向けに表示する organism。" +
          "任意項目（画像 / タグライン / Story / 活動情報 / ジャンル / リンク）は値が無ければその区画ごと描画しない。" +
          "リンクのラベルは BFF でマスタから解決済みの表示名を受け取る前提で、種別コードからの変換は持たない。",
      },
    },
  },
} satisfies Meta<typeof PublicArtistProfile>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "SAKU",
    tagline: "口ひとつで、フロアを揺らす。",
    imageUrl: "/image1.jpeg",
    story:
      "中学のときに動画を見て衝撃を受けた。\n\n初めての大会で負けて火がついた。\n\nシーンを盛り上げたい。",
    activityInfo: "拠点: 東京 / 形態: ソロ / 所属: 独立",
    genres: ["Beatbox", "Bass"],
    links: [
      { label: "YouTube", url: "https://youtube.com/@saku" },
      { label: "X", url: "https://x.com/saku" },
    ],
  },
};

export const MinimumFields: Story = {
  args: {
    name: "SAKU",
    tagline: null,
    imageUrl: null,
    story: null,
    activityInfo: null,
    genres: [],
    links: [],
  },
};
