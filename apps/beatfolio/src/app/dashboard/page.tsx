import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { Typography } from "@ui/design-system/components/atoms/Typography";
import { Card } from "@ui/design-system/components/atoms/Card";
import { Button } from "@ui/design-system/components/atoms/Button";
import { auth0 } from "../../libs/auth0";
import { createBffServerClient } from "../../utils/client";
import { EmailEditorClientAdapter } from "./EmailEditorClientAdapter";
import { AccountIdEditorClientAdapter } from "./AccountIdEditorClientAdapter";

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
    <div className="min-h-screen bg-background text-foreground px-4 pb-16 pt-24">
      <div className="container mx-auto flex max-w-3xl flex-col gap-6">
        <Typography variant="h2">Dashboard</Typography>

        <EmailEditorClientAdapter email={me.email} />

        {me.artist && (
          <AccountIdEditorClientAdapter accountId={me.artist.accountId} />
        )}

        {me.artist && !me.artist.hasProfile && (
          <Card>
            <div className="flex flex-col gap-3">
              <Typography variant="h4">アーティストプロフィール未作成</Typography>
              <Typography variant="small" tone="muted">
                プロフィールを作成すると、プレイヤー一覧に表示されるようになります。
              </Typography>
              <div>
                <Button asChild>
                  <Link href="/dashboard/profile">プロフィールを作成する</Link>
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
