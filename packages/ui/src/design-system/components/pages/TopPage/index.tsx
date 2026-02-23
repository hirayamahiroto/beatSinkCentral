"use client";

import React, { useState } from "react";
import { Image as AtomImage } from "@ui/design-system/components/atoms/Image";
import {
  Mic,
  Calendar,
  Play,
  ArrowRight,
  Star,
  Globe,
  Trophy,
  Users,
  Check,
  XCircle,
  X,
  Menu,
} from "lucide-react";
import { Link as AtomLink } from "@ui/design-system/components/atoms/Link";

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

// エントリーボタンコンポーネント
const EntryButton = ({
  capacity,
  entries,
  onEntry,
}: {
  capacity: number;
  entries: number;
  onEntry: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      await onEntry();
    } finally {
      setIsLoading(false);
    }
  };

  if (entries >= capacity) {
    return (
      <button
        disabled
        className="w-full px-6 py-3 bg-gray-600/20 text-gray-400 rounded-full flex items-center justify-center gap-2"
      >
        <XCircle className="w-5 h-5" />
        定員に達しました
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-medium transition-all flex items-center justify-center gap-2"
    >
      {isLoading ? (
        "処理中..."
      ) : (
        <>
          <Check className="w-5 h-5" />
          エントリーする
        </>
      )}
    </button>
  );
};

const TopPage = () => {
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Beatbox Championship 2024",
      date: "2024.03.21",
      time: "12:00 - 20:00",
      type: "大会",
      location: "東京都渋谷区",
      venue: "渋谷ストリームホール",
      capacity: 128,
      entries: 75,
      description:
        "日本一のビートボクサーを決める年に一度の大会。優勝者は世界大会への切符を手にします。",
      image: "/image1.jpeg",
      price: "5,000円",
    },
    // ... 他のイベントデータ
  ]);

  const handleEntry = async (eventId: number) => {
    try {
      // ここで実際のAPIコールを行う
      // const response = await fetch('/api/events/entry', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ eventId }),
      // });

      // 仮の実装：エントリー数を増やす
      setEvents(
        events.map((event) => {
          if (event.id === eventId) {
            return {
              ...event,
              entries: event.entries + 1,
            };
          }
          return event;
        })
      );

      alert("エントリーが完了しました！");
    } catch (error) {
      console.error("エントリーに失敗しました:", error);
      alert("エントリーに失敗しました。もう一度お試しください。");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <Header />
      {/* Hero Section */}
      <section className="relative h-screen">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.5)_100%)]" />
          <AtomImage src="/mv.webp" alt="Hero" className="object-cover" />
        </div>

        <div className="relative h-full flex flex-col items-center justify-center px-4">
          <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-6 [text-shadow:_-1px_-1px_0_#fff,_1px_-1px_0_#fff,_-1px_1px_0_#fff,_1px_1px_0_#fff,_0_0_20px_rgba(255,255,255,0.4)] drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
            Beat Sink Central
          </h1>
          <p className="text-xl text-gray-300 mb-12 text-center max-w-2xl">
            世界中のビートボクサーとイベントをつなぐプラットフォーム
          </p>
          <div className="flex gap-4">
            <AtomLink
              href="/players"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-medium transition-all"
            >
              プレイヤーを探す
            </AtomLink>
            <AtomLink
              href="/event"
              className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full font-medium transition-all"
            >
              イベントを見る
            </AtomLink>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-32 bg-gradient-to-b from-black to-blue-900/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <h2 className="text-4xl font-bold mb-6">Beat Sink Centralとは</h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              ビートボックスの世界をもっと身近に。プレイヤー、イベント、コミュニティをつなぎ、
              新たな可能性を創造するプラットフォームです。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Globe className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">グローバル</h3>
              <p className="text-gray-400">
                世界中のビートボクサーと繋がり、新たな交流を生み出します
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">プロフェッショナル</h3>
              <p className="text-gray-400">
                プロフェッショナルな情報とツールを提供し、成長をサポート
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-pink-500/10 flex items-center justify-center">
                <Star className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">コミュニティ</h3>
              <p className="text-gray-400">
                ビートボックスを愛する人々が集まり、文化を育てる場所
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-32 bg-black">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-20">イベント情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <div
                key={event.id}
                className="backdrop-blur-md bg-white/5 rounded-2xl overflow-hidden"
              >
                <div className="relative h-48">
                  <AtomImage
                    src={event.image}
                    alt={event.title}
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm mb-4">
                    {event.type}
                  </span>
                  <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                  <div className="space-y-2 text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        参加者: {event.entries}/{event.capacity}名
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-400 mb-6 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="space-y-3">
                    <EntryButton
                      capacity={event.capacity}
                      entries={event.entries}
                      onEntry={() => handleEntry(event.id)}
                    />
                    <AtomLink
                      href={`/eventDetail?id=${event.id}`}
                      className="block w-full px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full font-medium text-center transition-all"
                    >
                      詳細を見る
                    </AtomLink>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 bg-black">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-20">主な機能</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <AtomLink
              href="/playerList"
              className="group backdrop-blur-md bg-white/5 p-8 rounded-2xl hover:bg-white/10 transition-all"
            >
              <Mic className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">プレイヤー情報</h3>
              <p className="text-gray-400 mb-4">
                プロフィール、実績、スキルなど、プレイヤーの詳細情報を確認できます
              </p>
              <ArrowRight className="w-5 h-5 text-blue-400" />
            </AtomLink>

            <AtomLink
              href="/event"
              className="group backdrop-blur-md bg-white/5 p-8 rounded-2xl hover:bg-white/10 transition-all"
            >
              <Calendar className="w-10 h-10 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">イベント管理</h3>
              <p className="text-gray-400 mb-4">
                一般の大会やイベントの情報をチェックし、エントリーも簡単に行えます。
              </p>
              <p className="text-gray-400 mb-4">
                オーガナイザー向けには、イベントの作成や管理も可能です。
              </p>
              <ArrowRight className="w-5 h-5 text-purple-400" />
            </AtomLink>

            <AtomLink
              href="/playerList"
              className="group backdrop-blur-md bg-white/5 p-8 rounded-2xl hover:bg-white/10 transition-all"
            >
              <Play className="w-10 h-10 text-pink-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">
                パフォーマーのブッキング
              </h3>
              <p className="text-gray-400 mb-4">
                プレイヤー一覧からブッキングしたいプレイヤーを選択し、ブッキングを行えます。
              </p>
              <ArrowRight className="w-5 h-5 text-pink-400" />
            </AtomLink>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-sm py-8 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400">
              © 2024 Beat Sink Central. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                About
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Contact
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TopPage;
