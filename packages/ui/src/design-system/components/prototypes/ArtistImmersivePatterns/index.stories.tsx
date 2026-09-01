import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  PatternEditorial,
  PatternInterview,
  PatternSpotlight,
  PatternZoomDive,
  sampleArtist,
} from "./index";

const meta = {
  title: "prototypes/ArtistImmersivePatterns",
  component: PatternInterview,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "「知る → 応援する」検証 PRD §5-2 の詳細ページを、アーティストの背景（Story）に没入させる動線として探索する表示確認専用モック。" +
          "3 つの問い（始まり／転機／いま）→ いま・一つの行動（CTA）という PRD の骨格は共通で、没入のさせ方だけを変えた 4 パターン。" +
          "本実装ではなく世界観の比較検討用（PRD §5-3 の「見た目の作り込みは素材が揃ってから」の前段の方向決め）。",
      },
    },
  },
} satisfies Meta<typeof PatternInterview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interview: Story = {
  args: { artist: sampleArtist },
  render: () => <PatternInterview artist={sampleArtist} />,
  parameters: {
    docs: {
      description: {
        story:
          "G. インタビュー型。左に据えた肖像が章ごとに切り替わり、右で問いと答えを読み進める。雑誌の一問一答に没入する体験。読む速度を本人が制御できるのが強み。",
      },
    },
  },
};

export const ZoomDive: Story = {
  args: { artist: sampleArtist },
  render: () => <PatternZoomDive artist={sampleArtist} />,
  parameters: {
    docs: {
      description: {
        story:
          "H. ズーム没入型。極端なクローズアップ（モノクロ）から始まり、スクロールするほどカメラが引いて色が付き、人物の全体像と現在（いま）に到達する。「知るほど見えてくる」を画で表現。",
      },
    },
  },
};

export const Spotlight: Story = {
  args: { artist: sampleArtist },
  render: () => <PatternSpotlight artist={sampleArtist} />,
  parameters: {
    docs: {
      description: {
        story:
          "I. スポットライト型。暗転したステージにライトを当てながら章を進める。最後に客電が全部つき、CTA（ライブ情報）へ。クリック駆動なので前室（ストーリーズ形式）の検討（PRD §9-2）にも使える。",
      },
    },
  },
};

export const Editorial: Story = {
  args: { artist: sampleArtist },
  render: () => <PatternEditorial artist={sampleArtist} />,
  parameters: {
    docs: {
      description: {
        story:
          "J. 特集記事型。セリフ体・ドロップキャップ・引用ブロックで組んだ編集メディアの読み口。運営の翻訳（編集）を主役にする将来（事業の重心 B）と相性が良い。",
      },
    },
  },
};
