"use client";

import React, { useState } from "react";
import { X, Menu } from "lucide-react";
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

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="container mx-auto px-4 pt-24">
        <h1 className="text-4xl font-bold mb-2">運営情報</h1>
        <p className="text-xl text-gray-400 mb-8">About Us</p>

        <div className="space-y-12">
          {/* 会社概要 */}
          <section className="bg-white/5 backdrop-blur-lg rounded-lg p-8">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-700 pb-4">
                <div className="text-gray-400">運営者</div>
                <div className="md:col-span-2">HIROTO HIRAYAMA</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-700 pb-4">
                <div className="text-gray-400">開発者</div>
                <div className="md:col-span-2">HIROTO HIRAYAMA</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-700 pb-4">
                <div className="text-gray-400">事業内容</div>
                <div className="md:col-span-2">
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>ビートボックスイベントの情報一元化</li>
                    <li>プレイヤー情報の一元化</li>
                    <li>ビートボックスコミュニティの運営</li>
                    <li>ビートボックス関連商品の販売</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ミッション */}
          <section className="bg-white/5 backdrop-blur-lg rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">ミッション</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              日本のビートボックスシーンの発展と、世界で活躍できるビートボクサーの育成を目指しています。
              現在、ビートボックスの情報やブッキングはSNSに依存しており、情報が分散化している状況です。
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              私たちは、以下の課題解決に取り組んでいます：
            </p>
            <ul className="list-disc list-inside text-gray-300 leading-relaxed mb-4 ml-4">
              <li>情報の一元化による、イベントやアーティストの発見性の向上</li>
              <li>
                プロフェッショナルなプラットフォームの提供によるアーティストのブランディング支援
              </li>
              <li>
                体系的な情報管理による、ビートボックスシーンの持続的な発展
              </li>
              <li>
                企業とアーティストの健全なマッチングによる、透明性のあるブッキング体制の確立
              </li>
            </ul>
            <p className="text-gray-300 leading-relaxed">
              このプラットフォームを通じて、ビートボックスの新しい可能性を追求し、
              アーティストとファンの架け橋となることを目指しています。
            </p>
          </section>

          {/* お問い合わせ */}
          <section className="bg-white/5 backdrop-blur-lg rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">お問い合わせ</h2>
            <p className="text-gray-300 mb-4">
              イベントやサービスに関するお問い合わせは、以下のメールアドレスまでお願いいたします。
            </p>
            <p className="text-blue-400">xxxxxx@beatsinkcentral.com</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
