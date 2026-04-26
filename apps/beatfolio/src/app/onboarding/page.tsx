import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth0 } from "../../libs/auth0";
import { createBffServerClient } from "../../utils/client";
import { OnboardingClient } from "./OnboardingClient";

export default async function OnboardingPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const { user } = session;

  if (!user.email) {
    redirect("/auth/login");
  }

  const cookieHeader = (await headers()).get("cookie") ?? undefined;
  const client = createBffServerClient({ cookie: cookieHeader });
  const meRes = await client.api.users.me.$get();

  if (meRes.ok) {
    const me = await meRes.json();
    if (me.registered) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20" />

      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-4">
              Welcome!
            </h1>
            <p className="text-gray-300">プロフィールを作成して始めましょう</p>
          </div>

          <div className="backdrop-blur-md bg-white/5 p-8 rounded-2xl border border-white/10">
            <OnboardingClient email={user.email} />
          </div>
        </div>
      </div>
    </div>
  );
}
