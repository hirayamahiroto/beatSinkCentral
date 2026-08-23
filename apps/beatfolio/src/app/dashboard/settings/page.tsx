import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Typography } from "@ui/design-system/components/atoms/Typography";
import { auth0 } from "../../../libs/auth0";
import { getSettings } from "../../../fetchers/dashboard/getSettings";
import { EmailEditorClientAdapter } from "./EmailEditorClientAdapter";
import { AccountIdEditorClientAdapter } from "./AccountIdEditorClientAdapter";

export default async function SettingsPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const cookieHeader = (await headers()).get("cookie") ?? undefined;
  const result = await getSettings({ cookie: cookieHeader });

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  const settings = result.value;

  if (!settings.registered) {
    redirect("/onboarding");
  }

  const { email, accountId } = settings;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 pb-16 pt-24">
      <div className="container mx-auto flex max-w-3xl flex-col gap-6">
        <Typography variant="h2">アカウント設定</Typography>

        <EmailEditorClientAdapter email={email} />

        {accountId && <AccountIdEditorClientAdapter accountId={accountId} />}
      </div>
    </div>
  );
}
