import { PlayerDetailProps } from "./index";

const image1 = new URL(
  "../../../../../.storybook/assets/images/image1.jpeg",
  import.meta.url,
).href;

const samplePlayerData: PlayerDetailProps = {
  playerData: {
    image: image1,
    name: "HIROTO",
    tagline: "ビートボクサー・エンジニア・クリエイター",
    signatureSound: {
      title: "シグネチャーサウンド",
      description: "HIROTOのトレードマークテクニック",
      audio: "/api/placeholder/400/200",
    },
    badges: [
      { text: "世界チャンピオン", primary: true, icon: "🏆" },
      { text: "エンジニア", primary: false, icon: "👨‍💻" },
      { text: "プロデューサー", primary: false, icon: "🎤" },
      { text: "インストラクター", primary: false, icon: "🎧" },
    ],
    stats: [
      { value: "2.5M", label: "総視聴回数" },
      { value: "180K", label: "SNS総フォロワー数" },
      { value: "50+", label: "大会出場数" },
      { value: "8", label: "チャンピオンタイトル数" },
    ],
    story: [
      {
        tittle: "ビートボクサーとしての旅",
        description:
          "5歳でビートボックスに出会い、独学で技術を磨いてきました。2015年に初めて全国大会に出場し、その後数々の国際大会で上位入賞を果たしてきました。エンジニアとしてのバックグラウンドを活かし、音楽とテクノロジーを融合した新しいパフォーマンススタイルを確立。現在は世界各地でパフォーマンスを行いながら、次世代のビートボクサー育成にも力を入れています。音楽制作やアプリ開発にも取り組み、ビートボックス文化の発展に貢献しています。",
      },
    ],
    skills: [
      {
        name: "クラシックビートボックス",
        description:
          "基本的なキック、スネア、ハイハットを使った伝統的なスタイル",
      },
      {
        name: "ドラムンベース",
        description: "高速なブレイクビーツと重低音ベースラインが特徴",
      },
      {
        name: "メロディックビートボックス",
        description: "歌声とビートを同時に表現する高度なテクニック",
      },
      {
        name: "ルーピング",
        description: "リアルタイムでループを重ねる音楽制作技術",
      },
      {
        name: "エフェクト操作",
        description: "デジタルエフェクトとアナログサウンドの融合",
      },
      {
        name: "インプロビゼーション",
        description: "即興での音楽創作とバトルパフォーマンス",
      },
    ],
    performance: [
      {
        title: "World Championship Final 2024",
        views: "2.5M",
        duration: "4:32",
        image: "/api/placeholder/400/200",
      },
      {
        title: "Beatbox Tutorial: Advanced Techniques",
        views: "890K",
        duration: "8:15",
        image: "/api/placeholder/400/200",
      },
      {
        title: "Collaboration with Tokyo Orchestra",
        views: "1.2M",
        duration: "6:20",
        image: "/api/placeholder/400/200",
      },
      {
        title: "Studio Session: Looping Mastery",
        views: "456K",
        duration: "3:45",
        image: "/api/placeholder/400/200",
      },
      {
        title: "Battle Highlights Compilation",
        views: "720K",
        duration: "5:28",
        image: "/api/placeholder/400/200",
      },
      {
        title: "Live Performance at Shibuya",
        views: "340K",
        duration: "12:15",
        image: "/api/placeholder/400/200",
      },
    ],
    activities: [
      {
        date: "2024年3月",
        title: "Global Beatbox Championship 優勝",
        description:
          "フランス・パリで開催された世界大会で初優勝を達成。決勝では圧倒的なパフォーマンスで観客を魅了し、満場一致での勝利を収めました。",
      },
      {
        date: "2024年1月",
        title: "音楽アプリ「BeatTrainer」リリース",
        description:
          "ビートボクサー向けトレーニングアプリを開発・公開。AI技術を活用したリアルタイム分析機能が話題となり、リリース1週間で10万ダウンロードを突破。",
      },
      {
        date: "2023年11月",
        title: "TEDx Tokyo 登壇",
        description:
          "「音楽とテクノロジーの融合」をテーマに講演。ビートボックスの可能性と未来について語り、会場からスタンディングオベーションを受けました。",
      },
      {
        date: "2023年8月",
        title: "Asia Beatbox Championship 準優勝",
        description:
          "韓国・ソウルで開催されたアジア大会でシルバーメダル獲得。特に準決勝でのパフォーマンスは大会史上最高得点を記録。",
      },
      {
        date: "2023年5月",
        title: "初のソロアルバム「Rhythmic Fusion」発売",
        description:
          "ビートボックスとエレクトロニックミュージックを融合したオリジナルアルバムをリリース。iTunes Electronチャートで1位を獲得。",
      },
      {
        date: "2022年12月",
        title: "ビートボックススクール開校",
        description:
          "東京・渋谷に初心者から上級者まで対応するビートボックス専門スクールを開校。既に100名以上の生徒が在籍。",
      },
    ],
  },
};

export { samplePlayerData };
export type { PlayerDetailProps };
