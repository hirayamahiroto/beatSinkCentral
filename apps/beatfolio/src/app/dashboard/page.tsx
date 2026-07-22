import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { Typography } from "@ui/design-system/components/atoms/Typography";
import { Card } from "@ui/design-system/components/atoms/Card";
import { Button } from "@ui/design-system/components/atoms/Button";
import { auth0 } from "../../libs/auth0";
import { createBeatfolioBffServerClient } from "../../utils/client";

export default async function DashboardPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const cookieHeader = (await headers()).get("cookie") ?? undefined;
  const client = createBeatfolioBffServerClient({ cookie: cookieHeader });
  const res = await client.api.dashboard.$get();

  if (!res.ok) {
    throw new Error("Failed to fetch dashboard");
  }

  const dashboard = await res.json();

  if (!dashboard.registered) {
    redirect("/onboarding");
  }

  const { artist } = dashboard;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 pb-16 pt-24">
      <div className="container mx-auto flex max-w-3xl flex-col gap-6">
        <Typography variant="h2">Dashboard</Typography>

        {artist && (
          <Card>
            <div className="flex flex-col gap-3">
              <Typography variant="h4">アーティストプロフィール</Typography>
              <Typography variant="small" tone="muted">
                {artist.hasProfile
                  ? "プロフィールはプレイヤー一覧に表示されます。内容を更新できます。"
                  : "プロフィールを作成すると、プレイヤー一覧に表示されるようになります。"}
              </Typography>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/dashboard/profile/edit">
                    {artist.hasProfile
                      ? "プロフィールを編集する"
                      : "プロフィールを作成する"}
                  </Link>
                </Button>
                {artist.hasProfile && (
                  <Button asChild variant="outline">
                    <Link href={`/players/${artist.accountId}`}>
                      公開ページを見る
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div className="flex flex-col gap-3">
            <Typography variant="h4">アカウント設定</Typography>
            <Typography variant="small" tone="muted">
              メールアドレスとアカウントIDを変更できます。
            </Typography>
            <div>
              <Button asChild variant="outline">
                <Link href="/dashboard/settings">設定を開く</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
