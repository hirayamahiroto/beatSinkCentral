import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth0 } from "../../../libs/auth0";
import { createBffServerClient } from "../../../utils/client";
import { ProfileWizardClientAdapter } from "./ProfileWizardClientAdapter";
import { toWizardValues } from "./ProfileWizardClientAdapter/toWizardValues";

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

  const [profileRes, linkTypesRes] = await Promise.all([
    client.api.artists.me.profile.$get(),
    client.api["link-types"].$get(),
  ]);

  if (!profileRes.ok) {
    throw new Error("Failed to fetch profile");
  }
  if (!linkTypesRes.ok) {
    throw new Error("Failed to fetch link types");
  }

  const { profile } = await profileRes.json();
  const { linkTypes } = await linkTypesRes.json();
  const defaultValues = profile ? toWizardValues(profile) : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 pt-12 pb-16">
      <div className="container mx-auto max-w-2xl">
        <ProfileWizardClientAdapter
          email={me.email}
          linkTypeOptions={linkTypes}
          defaultValues={defaultValues}
        />
      </div>
    </div>
  );
}
