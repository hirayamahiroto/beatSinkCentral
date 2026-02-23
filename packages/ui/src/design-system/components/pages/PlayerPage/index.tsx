"use client";

import React, { useState } from "react";
import { Link as AtomLink } from "@ui/design-system/components/atoms/Link";
import { Image } from "@ui/design-system/components/atoms/Image";
import {
  Play,
  Users,
  Music,
  Code,
  Trophy,
  Calendar,
  ExternalLink,
  X,
  Menu,
} from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed left-0 top-0 w-full z-50 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="text-xl font-bold text-white">Beat Sink Central</div>
          <button
            className="sm:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="sm:hidden bg-black/90 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col gap-4">
              <AtomLink href="/" className="text-gray-300 hover:text-white transition-colors px-4 py-2">ホーム</AtomLink>
              <AtomLink href="/playerList" className="text-gray-300 hover:text-white transition-colors px-4 py-2">プレイヤー</AtomLink>
              <AtomLink href="/event" className="text-gray-300 hover:text-white transition-colors px-4 py-2">イベント</AtomLink>
              <AtomLink href="/about" className="text-gray-300 hover:text-white transition-colors px-4 py-2">運営情報</AtomLink>
              <hr className="border-white/10" />
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-sm font-medium transition-colors w-full">ログイン</button>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

type SignatureSound = {
  title: string;
  description: string;
  audio?: string;
};

type Badge = {
  text: string;
  primary: boolean;
  icon: string;
};

type Stat = {
  value: string;
  label: string;
};

type Story = {
  tittle: string;
  description: string;
};

type Skill = {
  name: string;
  description: string;
};

type Performance = {
  title: string;
  views: string;
  duration: string;
  image: string;
};

type Activity = {
  date: string;
  title: string;
  description: string;
};

type PlayerData = {
  image: string;
  name: string;
  tagline: string;
  signatureSound?: SignatureSound;
  badges: Badge[];
  stats: Stat[];
  story: Story[];
  skills: Skill[];
  performance: Performance[];
  activities: Activity[];
};

export type PlayerDetailProps = {
  playerData: PlayerData;
};

const TABS = [
  { id: "story", label: "ストーリー", icon: Calendar },
  { id: "skills", label: "スキル", icon: Code },
  { id: "performance", label: "パフォーマンス", icon: Play },
  { id: "activities", label: "活動＆実績", icon: Trophy },
] as const;

type TabId = (typeof TABS)[number]["id"];

function PlayerPage({ playerData }: PlayerDetailProps) {
  const [activeTab, setActiveTab] = useState<TabId>("story");
  const [isPlaying, setIsPlaying] = useState(false);

  const safePlayerData = {
    ...playerData,
    badges: playerData.badges || [],
    stats: playerData.stats || [],
    skills: playerData.skills || [],
    performance: playerData.performance || [],
    activities: playerData.activities || [],
  };

  const getIconForBadge = (iconName: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      trophy: <Trophy className="w-4 h-4" />,
      code: <Code className="w-4 h-4" />,
      music: <Music className="w-4 h-4" />,
      users: <Users className="w-4 h-4" />,
    };
    return iconMap[iconName] || <Trophy className="w-4 h-4" />;
  };

  const WaveBar = ({ delay }: { delay: number }) => (
    <div
      className={`bg-purple-500 w-1 rounded-full transition-all duration-300 ease-in-out ${
        isPlaying ? "animate-pulse" : ""
      }`}
      style={{
        height: isPlaying ? `${Math.random() * 60 + 20}%` : "10%",
        animationDelay: `${delay}s`,
      }}
    />
  );

  const togglePlaySound = () => {
    setIsPlaying(!isPlaying);
  };

  const StorySection = () => (
    <section className="mb-16">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Calendar className="w-6 h-6 text-purple-500" />
        ビートボクサーとしての旅
      </h2>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 bg-gray-800 rounded-xl p-6 h-fit">
          <div className="space-y-4 text-gray-300 leading-relaxed">
            {safePlayerData.story.map((story) => (
              <div key={story.tittle}>
                <h3 className="text-lg font-bold">{story.tittle}</h3>
                <p>{story.description}</p>
              </div>
            ))}
          </div>
        </div>
        {safePlayerData.image && (
          <div className="w-full lg:w-80 h-96 rounded-xl overflow-hidden flex-shrink-0">
            <Image
              src={safePlayerData.image}
              alt={`${safePlayerData.name}のパフォーマンス`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );

  const SkillsSection = () => (
    <section className="mb-16">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Code className="w-6 h-6 text-purple-500" />
        スキル
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safePlayerData.skills.map((skill, index) => (
          <div
            key={index}
            className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-500 flex-shrink-0">
                <Music className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">{skill.name}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {skill.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const PerformanceSection = () => (
    <section className="mb-16">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Play className="w-6 h-6 text-purple-500" />
        パフォーマンス
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {safePlayerData.performance.map((performance, index) => (
          <div
            key={index}
            className="bg-gray-800 rounded-xl overflow-hidden group cursor-pointer hover:bg-gray-750 transition-colors"
          >
            <div className="relative h-48 bg-gray-700 overflow-hidden">
              <Image
                src={performance.image}
                alt={performance.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                <div className="w-16 h-16 bg-purple-500/80 rounded-full flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-sm px-2 py-1 rounded">
                {performance.duration}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2">{performance.title}</h3>
              <div className="flex justify-between items-center text-gray-400 text-sm">
                <span>{performance.views} views</span>
                <ExternalLink className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const ActivitiesSection = () => (
    <section className="mb-16">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Trophy className="w-6 h-6 text-purple-500" />
        活動＆実績
      </h2>
      <div className="relative pl-8">
        <div className="absolute left-1.25 top-0 bottom-0 w-0.25 bg-gray-700" />
        {safePlayerData.activities.map((activity, index) => (
          <div key={index} className="relative mb-8 last:mb-0">
            <div className="absolute -left-8 w-3 h-3 bg-purple-500 rounded-full" />
            <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors">
              <div className="text-sm text-gray-400 mb-2">{activity.date}</div>
              <h3 className="text-xl font-bold mb-2">{activity.title}</h3>
              <p className="text-gray-300 leading-relaxed">
                {activity.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderActiveSection = () => {
    switch (activeTab) {
      case "story":
        return <StorySection />;
      case "skills":
        return <SkillsSection />;
      case "performance":
        return <PerformanceSection />;
      case "activities":
        return <ActivitiesSection />;
      default:
        return <StorySection />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />

      <div className="relative h-[80vh] overflow-hidden flex items-end">
        <div className="absolute inset-0">
          <Image
            src={safePlayerData.image}
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex flex-col lg:flex-row items-end gap-8">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {safePlayerData.name}
              </h1>
              <p className="text-lg text-gray-300 mb-4">
                {safePlayerData.tagline}
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6">
                {safePlayerData.badges.map((badge, index) => (
                  <span
                    key={index}
                    className={`px-4 py-1 rounded-full text-sm flex items-center gap-2 transition-colors ${
                      badge.primary
                        ? "bg-purple-500 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {getIconForBadge(badge.icon)}
                    {badge.text}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {safePlayerData.stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {safePlayerData.signatureSound && (
        <div className="relative -mt-6 mx-auto max-w-5xl px-4">
          <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-4 shadow-2xl border border-gray-700">
            <button
              onClick={togglePlaySound}
              className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors flex-shrink-0"
              aria-label="音声を再生"
            >
              <Play className="w-5 h-5 text-white ml-0.5" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">
                {safePlayerData.signatureSound.title}
              </div>
              <div className="text-sm text-gray-400 truncate">
                {safePlayerData.signatureSound.description}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1 h-10 px-4">
              {[...Array(20)].map((_, i) => (
                <WaveBar key={i} delay={i * 0.1} />
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="sticky top-20 bg-gray-900/95 backdrop-blur-sm py-4 mb-8 z-40 border-b border-gray-700">
          <div className="flex space-x-6 overflow-x-auto">
            {TABS.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 whitespace-nowrap font-medium relative transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "text-purple-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {renderActiveSection()}
      </main>
    </div>
  );
}

export { PlayerPage };
