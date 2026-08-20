import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth0 } from "../../../../libs/auth0";
import { createBeatfolioBffServerClient } from "../../../../utils/client";
import { ProfileWizardClientAdapter } from "./ProfileWizardClientAdapter";

export default async function ProfileEditPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const cookieHeader = (await headers()).get("cookie") ?? undefined;
  const client = createBeatfolioBffServerClient({ cookie: cookieHeader });
  const res = await client.api.dashboard.profile.edit.$get();

  if (!res.ok) {
    throw new Error("Failed to fetch profile edit screen");
  }

  const screen = await res.json();

  if (!screen.registered) {
    redirect("/onboarding");
  }

  const { email, artistId, linkTypeOptions, defaultValues } = screen;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 pt-12 pb-16">
      <div className="container mx-auto max-w-2xl">
        <ProfileWizardClientAdapter
          email={email}
          artistId={artistId}
          linkTypeOptions={linkTypeOptions}
          defaultValues={defaultValues ?? undefined}
        />
      </div>
    </div>
  );
}
