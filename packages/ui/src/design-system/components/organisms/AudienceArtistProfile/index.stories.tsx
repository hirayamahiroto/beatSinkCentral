import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AudienceArtistProfile } from "./index";

const meta = {
  title: "organisms/AudienceArtistProfile",
  component: AudienceArtistProfile,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "「知る → 応援する」検証 PRD §5-2 の大衆向け詳細ページを表示する organism。" +
          "区画は 引っかかり → 人（Story 章）→ 翻訳 → 聴きどころ → いま／一つの行動 → 戻り道 → 繋がり の順で、" +
          "オファーの有無でページの状態が切り替わる（あり: 固定バー＋チケット CTA / なし: Story 主役で軽い応援が主 CTA）。" +
          "任意項目が空のときは区画ごと描画しない。" +
          "Story の問い・日付表示・共演者のリンク先は BFF で解決済みの値を受け取る前提で、変換ロジックは持たない。" +
          "Story の展開状態・章末 DOM 参照・メール購読フォームの状態はすべて Controlled（props で受け取る）。" +
          "状態の保持と計測の送信は利用側（ClientAdapter）が担う。" +
          "本人の言葉（Story）と運営の言葉（翻訳）は区画を分けて表示する。",
      },
    },
  },
} satisfies Meta<typeof AudienceArtistProfile>;

export default meta;

type Story = StoryObj<typeof meta>;

const storyChapters = [
  {
    question: "始まりの話",
    body: "中学の教室で、先輩が口だけでドラムを鳴らすのを見た。楽器が買えなかった自分に「これならできる」と思ったのが最初だった。",
  },
  {
    question: "転機になったこと",
    body: "初めて出た大会の一回戦で負けた夜、悔しくて朝まで録音を聴き返した。そこから毎日 2 時間、駅の高架下で練習するようになった。",
  },
  {
    question: "いま目指していること",
    body: "ビートボックスを知らない人の前でやるライブを増やしたい。技の名前が通じない場所でこそ、音そのもので驚かせたい。",
  },
];

const offer = {
  dateLabel: "2026.10.12 (SUN) 18:00",
  venue: "下北沢 BASEMENT",
  ticketUrl: "https://example.com/ticket",
  comment: "初めての人にこそ来てほしい、声だけのワンマンです。",
  performers: [
    { name: "RHYTHM-K", profileUrl: "/players/rhythm-k" },
    { name: "AOI", profileUrl: null },
  ],
};

const listeningPoint = {
  embedUrl: "https://www.youtube.com/embed/GNVFV1WrciM",
  comment: "1:12 からのベースの切り替え。ここが会場で一番歓声が上がるところ。",
};

const supportLinks = [
  { label: "YouTube", url: "https://youtube.com/@saku" },
  { label: "Instagram", url: "https://instagram.com/saku" },
  { label: "X", url: "https://x.com/saku" },
];

type InteractiveArgs = React.ComponentProps<typeof AudienceArtistProfile>;

const Interactive = (args: InteractiveArgs) => {
  const [storyExpanded, setStoryExpanded] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [subscribed, setSubscribed] = React.useState(false);

  return (
    <AudienceArtistProfile
      {...args}
      storyExpanded={storyExpanded}
      onExpandStory={() => setStoryExpanded(true)}
      onChapterEndRef={() => {}}
      email={email}
      onEmailChange={setEmail}
      subscribed={subscribed}
      onSubmitSubscription={() => setSubscribed(true)}
    />
  );
};

const baseArgs: InteractiveArgs = {
  name: "SAKU",
  tagline: "口ひとつで、フロアを揺らす。",
  imageUrl: "/image2.jpeg",
  genres: ["Beatbox", "Bass"],
  storyChapters,
  storyExpanded: false,
  onExpandStory: () => {},
  onChapterEndRef: () => {},
  translation:
    "SAKU の凄さは「低音の説得力」です。声だけとは思えない重さのベースを、曲の展開に合わせて自在に出し入れします。目を閉じて聴くとバンドがいるようにしか聞こえない、その種明かしをライブで確かめてほしいアーティストです。",
  listeningPoint,
  offer,
  supportLinks,
  onOfferClick: () => {},
  onSupportClick: () => {},
  email: "",
  onEmailChange: () => {},
  subscribed: false,
  onSubmitSubscription: () => {},
};

export const OfferActive: Story = {
  args: baseArgs,
  render: (args) => <Interactive {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          "オファーあり期間の全区画表示。固定バーが常時オファーを見せ、共演者には登録済み（リンク）と未登録（招待）が混在する。",
      },
    },
  },
};

export const NoOffer: Story = {
  args: {
    ...baseArgs,
    offer: null,
  },
  render: (args) => <Interactive {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          "オファーが無い期間の平常レイアウト。Story が主役になり、主 CTA は軽い応援（SNS）へ切り替わる。オファー由来の区画（固定バー・繋がり）は消える。",
      },
    },
  },
};

export const WithoutTranslation: Story = {
  args: {
    ...baseArgs,
    translation: null,
  },
  render: (args) => <Interactive {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          "翻訳なし群（H4 検証の対照群）。運営の言葉の区画だけが消え、本人の言葉は変わらない。",
      },
    },
  },
};

export const MinimumFields: Story = {
  args: {
    name: "SAKU",
    tagline: null,
    imageUrl: null,
    genres: [],
    storyChapters: [storyChapters[0]],
    storyExpanded: false,
    onExpandStory: () => {},
    onChapterEndRef: () => {},
    translation: null,
    listeningPoint: null,
    offer: null,
    supportLinks,
    onOfferClick: () => {},
    onSupportClick: () => {},
    email: "",
    onEmailChange: () => {},
    subscribed: false,
    onSubmitSubscription: () => {},
  },
  render: (args) => <Interactive {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          "書き始めたばかりの状態。空の区画は描画されず、「実績ゼロでも成立する」を空欄を出さないことで守る。",
      },
    },
  },
};
