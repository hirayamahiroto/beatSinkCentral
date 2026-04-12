import Image from "next/image";
import Link from "next/link";
import { Icon } from "@ui/design-system/components/atoms/Icon";
import { Button } from "@ui/design-system/components/atoms/Button";
import { Card } from "@ui/design-system/components/atoms/Card";
import { CardContent } from "@ui/design-system/components/atoms/Card/Content";
import { CardTitle } from "@ui/design-system/components/atoms/Card/Title";
import { CardDescription } from "@ui/design-system/components/atoms/Card/Description";
import { getSession } from "../libs/auth0";

export default async function Home() {
  const session = await getSession();

  return (
    <>
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
            <Button asChild>
              <Link href="/players">プレイヤーを探す</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/event">イベントを見る</Link>
            </Button>
            {!session && (
              <Button asChild variant="ghost">
                <Link href="/auth/login">ログイン / 新規登録</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

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
                <Icon name="Globe" className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">グローバル</h3>
              <p className="text-gray-400">
                世界中のビートボクサーと繋がり、新たな交流を生み出します
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Icon name="Trophy" className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">プロフェッショナル</h3>
              <p className="text-gray-400">
                プロフェッショナルな情報とツールを提供し、成長をサポート
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-pink-500/10 flex items-center justify-center">
                <Icon name="Star" className="w-8 h-8 text-pink-400" />
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
            <Link href="/players" className="group">
              <Card>
                <CardContent>
                  <Icon name="Mic" className="w-10 h-10 text-blue-400 mb-4" />
                  <CardTitle>プレイヤー情報</CardTitle>
                  <CardDescription>
                    プロフィール、実績、スキルなど、プレイヤーの詳細情報を確認できます
                  </CardDescription>
                  <Icon
                    name="ArrowRight"
                    className="w-5 h-5 text-blue-400 mt-4"
                  />
                </CardContent>
              </Card>
            </Link>

            <div className="relative select-none">
              <Card className="opacity-30 blur-[6px]">
                <CardContent>
                  <div className="w-10 h-10 bg-purple-400/20 rounded mb-4" />
                  <div className="h-4 w-32 bg-white/20 rounded mb-4" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-white/10 rounded" />
                    <div className="h-3 w-3/4 bg-white/10 rounded" />
                  </div>
                </CardContent>
              </Card>
              <p className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-400">
                Coming Soon
              </p>
            </div>

            <div className="relative select-none">
              <Card className="opacity-30 blur-[6px]">
                <CardContent>
                  <div className="w-10 h-10 bg-pink-400/20 rounded mb-4" />
                  <div className="h-4 w-32 bg-white/20 rounded mb-4" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-white/10 rounded" />
                    <div className="h-3 w-3/4 bg-white/10 rounded" />
                  </div>
                </CardContent>
              </Card>
              <p className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-400">
                Coming Soon
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
