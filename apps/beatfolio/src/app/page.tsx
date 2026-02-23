import Image from "next/image";
import {
  Mic,
  Calendar,
  Play,
  ArrowRight,
  Star,
  Globe,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { auth0 } from "../libs/auth0";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth0.getSession();

  if (!session) {
    return redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative h-screen">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.5)_100%)]" />
          <Image src="/mv.webp" alt="Hero" fill className="object-cover" />
        </div>

        <div className="relative h-full flex flex-col items-center justify-center px-4">
          <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-6 [text-shadow:_-1px_-1px_0_#fff,_1px_-1px_0_#fff,_-1px_1px_0_#fff,_1px_1px_0_#fff,_0_0_20px_rgba(255,255,255,0.4)] drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
            Beat Sink Central
          </h1>
          <p className="text-xl text-gray-300 mb-12 text-center max-w-2xl">
            世界中のビートボクサーとイベントをつなぐプラットフォーム
          </p>
          <div className="flex gap-4">
            <Link
              href="/players"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-medium transition-all"
            >
              プレイヤーを探す
            </Link>
            <Link
              href="/event"
              className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full font-medium transition-all"
            >
              イベントを見る
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full font-medium transition-all"
            >
              ログイン
            </Link>
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

      <section className="py-32 bg-black">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-20">主な機能</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Link
              href="/playerList"
              className="group backdrop-blur-md bg-white/5 p-8 rounded-2xl hover:bg-white/10 transition-all"
            >
              <Mic className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">プレイヤー情報</h3>
              <p className="text-gray-400 mb-4">
                プロフィール、実績、スキルなど、プレイヤーの詳細情報を確認できます
              </p>
              <ArrowRight className="w-5 h-5 text-blue-400" />
            </Link>

            <Link
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
            </Link>

            <Link
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
            </Link>
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
}
