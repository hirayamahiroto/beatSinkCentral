import { auth0 } from "../../libs/auth0";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

export default async function OnboardingPage() {
  const session = await auth0.getSession();

  if (!session) {
    return redirect("/auth/login");
  }

  const { user } = session;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20" />

      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-4">
              Welcome!
            </h1>
            <p className="text-gray-300">
              プロフィールを作成して始めましょう
            </p>
          </div>

          <div className="backdrop-blur-md bg-white/5 p-8 rounded-2xl border border-white/10">
            <div className="mb-6 p-4 bg-white/5 rounded-xl">
              <p className="text-sm text-gray-400 mb-1">ログイン中のアカウント</p>
              <p className="text-white font-medium">{user.email}</p>
            </div>

            <ProfileForm />
          </div>
        </div>
      </div>
    </div>
  );
}
