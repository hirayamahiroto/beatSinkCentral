import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { Typography } from "@ui/design-system/components/atoms/Typography";
import { getSession } from "../../../libs/auth0";
import { getSettings } from "../../../fetchers/dashboard/getSettings";
import { DegradedScreen } from "../../shared/DegradedScreen";
import { resolveSettingsView } from "./resolveSettingsView";
import { EmailEditorClientAdapter } from "./EmailEditorClientAdapter";
import { AccountIdEditorClientAdapter } from "./AccountIdEditorClientAdapter";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const cookieHeader = (await headers()).get("cookie") ?? undefined;
  const view = resolveSettingsView(await getSettings({ cookie: cookieHeader }));

  if (view.kind === "redirect") redirect(view.to);
  if (view.kind === "notFound") notFound();
  if (view.kind === "degraded") {
    return <DegradedScreen feedback={view.feedback} />;
  }

  const { email, accountId } = view.data;

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
