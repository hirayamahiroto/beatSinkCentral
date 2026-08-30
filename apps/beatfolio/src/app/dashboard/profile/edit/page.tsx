import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "../../../../libs/auth0";
import { getProfileEditScreen } from "../../../../fetchers/dashboard/getProfileEditScreen";
import { DegradedScreen } from "../../../shared/DegradedScreen";
import { resolveProfileEditView } from "./resolveProfileEditView";
import { ProfileWizardClientAdapter } from "./ProfileWizardClientAdapter";

export default async function ProfileEditPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const cookieHeader = (await headers()).get("cookie") ?? undefined;
  const view = resolveProfileEditView(
    await getProfileEditScreen({ cookie: cookieHeader }),
  );

  if (view.kind === "redirect") redirect(view.to);
  if (view.kind === "notFound") notFound();
  if (view.kind === "degraded") {
    return <DegradedScreen feedback={view.feedback} />;
  }

  const { email, linkTypeOptions, defaultValues } = view.data;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 pt-12 pb-16">
      <div className="container mx-auto max-w-2xl">
        <ProfileWizardClientAdapter
          email={email}
          linkTypeOptions={linkTypeOptions}
          defaultValues={defaultValues ?? undefined}
        />
      </div>
    </div>
  );
}
