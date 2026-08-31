import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Typography } from "@ui/design-system/components/atoms/Typography";
import { getSettings } from "../../../fetchers/dashboard/getSettings";
import { EmailEditorClientAdapter } from "./EmailEditorClientAdapter";
import { HandleEditorClientAdapter } from "./HandleEditorClientAdapter";

export default async function SettingsPage() {
  const cookieHeader = (await headers()).get("cookie") ?? undefined;
  const result = await getSettings({ cookie: cookieHeader });

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  const settings = result.value;

  if (!settings.registered) {
    redirect("/onboarding");
  }

  const { email, handle } = settings;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 pb-16 pt-24">
      <div className="container mx-auto flex max-w-3xl flex-col gap-6">
        <Typography variant="h2">アカウント設定</Typography>

        <EmailEditorClientAdapter email={email} />

        {handle && <HandleEditorClientAdapter handle={handle} />}
      </div>
    </div>
  );
}
