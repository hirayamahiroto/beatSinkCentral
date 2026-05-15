import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth0 } from "../../libs/auth0";
import { createBffServerClient } from "../../utils/client";
import { EmailEditor } from "./EmailEditor";

export default async function DashboardPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const cookieHeader = (await headers()).get("cookie") ?? undefined;
  const client = createBffServerClient({ cookie: cookieHeader });
  const res = await client.api.users.me.$get();

  if (!res.ok) {
    throw new Error("Failed to fetch user info");
  }

  const me = await res.json();

  if (!me.registered) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-8">
          Dashboard
        </h1>

        <EmailEditor email={me.email} />

        {me.artist && (
          <section className="backdrop-blur-md bg-white/5 p-6 rounded-2xl border border-white/10 mb-6">
            <p className="text-sm text-gray-400 mb-1">Account ID</p>
            <p className="text-white font-medium">@{me.artist.accountId}</p>
          </section>
        )}

        {me.artist && !me.artist.hasProfile && (
          <section className="backdrop-blur-md bg-yellow-500/10 p-6 rounded-2xl border border-yellow-500/20">
            <p className="text-yellow-300 font-medium mb-2">
              アーティストプロフィール未作成
            </p>
            <p className="text-gray-300 text-sm mb-4">
              プロフィールを作成すると、プレイヤー一覧に表示されるようになります。
            </p>
            <Link
              href="/dashboard/profile"
              className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-sm font-medium transition-all"
            >
              プロフィールを作成する
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
