import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { Typography } from "@ui/design-system/components/atoms/Typography";
import { Card } from "@ui/design-system/components/atoms/Card";
import { Button } from "@ui/design-system/components/atoms/Button";
import { getDashboard } from "../../fetchers/dashboard/getDashboard";
import { ProfilePublishClientAdapter } from "./ProfilePublishClientAdapter";

export default async function DashboardPage() {
  const cookieHeader = (await headers()).get("cookie") ?? undefined;
  const result = await getDashboard({ cookie: cookieHeader });

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  const dashboard = result.value;

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
                {artist.profile
                  ? "保存した内容はいつでも編集できます。公開するかどうかは下の公開状態から切り替えます。"
                  : "プロフィールを作成すると、公開できるようになります。"}
              </Typography>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/dashboard/profile/edit">
                    {artist.profile
                      ? "プロフィールを編集する"
                      : "プロフィールを作成する"}
                  </Link>
                </Button>
                {artist.profile?.published && (
                  <Button asChild variant="outline">
                    <Link href={`/players/${artist.handle}`}>
                      公開ページを見る
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {artist?.profile && (
          <ProfilePublishClientAdapter
            published={artist.profile.published}
            missingRequirements={artist.profile.missingPublishRequirements}
          />
        )}

        <Card>
          <div className="flex flex-col gap-3">
            <Typography variant="h4">アカウント設定</Typography>
            <Typography variant="small" tone="muted">
              メールアドレスとハンドルを変更できます。
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
