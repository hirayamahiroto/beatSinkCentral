import { redirect } from "next/navigation";
import { Typography } from "@ui/design-system/components/atoms/Typography";
import { getSettings } from "../../../fetchers/dashboard/getSettings";
import { EmailEditorClientAdapter } from "./EmailEditorClientAdapter";
import { AccountIdEditorClientAdapter } from "./AccountIdEditorClientAdapter";

export default async function SettingsPage() {
  const result = await getSettings();

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
