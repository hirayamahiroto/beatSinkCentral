import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth0 } from "../../../libs/auth0";
import { createBffServerClient } from "../../../utils/client";
import { ProfileWizardClientAdapter } from "./ProfileWizardClientAdapter";

export default async function ProfileRegisterPage() {
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
    <div className="min-h-screen bg-background text-foreground px-4 pt-12 pb-16">
      <div className="container mx-auto max-w-2xl">
        <ProfileWizardClientAdapter email={me.email} />
      </div>
    </div>
  );
}
