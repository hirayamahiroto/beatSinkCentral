import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArtistImmersiveProfile, type ImmersiveArtist } from "./index";

const artist: ImmersiveArtist = {
  name: "SAKU",
  tagline: "口ひとつで、フロアを揺らす。",
  heroImageUrl: "/image5.jpeg",
  genres: ["Beatbox", "Bass"],
  activityInfo: "拠点: 東京 / 形態: ソロ",
  chapters: [
    {
      key: "beginning",
      label: "始まり",
      body: "鏡の前で、全然鳴らなかった夜。中学2年の帰り道、友達のスマホで見た動画が全部だった。\n\nその日の夜、洗面所の鏡の前で真似をして、全然鳴らなくて、それが悔しくて続いた。",
    },
    {
      key: "turning_point",
      label: "転機",
      body: "初戦負けの帰り道、イヤホンの中で全部わかった。自分の録音は「速い」だけで「重く」なかった。\n\nその日から低音だけを一年やった。技の数を増やすのをやめた。",
    },
    {
      key: "concept",
      label: "何を表現したいのか",
      body: "知らない人の前で、音だけで勝負したい。ビートボックスを「見せ物」ではなく「音楽」として聴いてもらう場所を、自分でつくりたい。",
    },
  ],
  links: [
    { label: "YouTube", url: "https://youtube.com/@saku" },
    { label: "X", url: "https://x.com/saku" },
  ],
  primaryAction: null,
};

const meta = {
  title: "organisms/ArtistImmersiveProfile",
  component: ArtistImmersiveProfile,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "公開プロフィールを Story の章に没入させて読ませる organism。アーティストが選んだ表現パターン（DB マスタ `presentation_patterns` のコード）で 4 つの見せ方を切り替える。" +
          "章の見出しは本文の先頭文から導出し、写真は 1 枚を章ごとの色調で使い分ける。",
      },
    },
  },
  args: { artist, onLinkClick: () => {} },
} satisfies Meta<typeof ArtistImmersiveProfile>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interview: Story = { args: { pattern: "interview" } };
export const ZoomDive: Story = { args: { pattern: "zoom_dive" } };
export const Spotlight: Story = { args: { pattern: "spotlight" } };
export const Editorial: Story = { args: { pattern: "editorial" } };

export const WithPrimaryAction: Story = {
  args: {
    pattern: "interview",
    artist: {
      ...artist,
      primaryAction: {
        reason:
          "10月のワンマンに来てほしい。ここで話したことを、全部そこで鳴らす。",
        label: "ライブ情報を見る",
        href: "https://example.com/live",
      },
    },
  },
};
