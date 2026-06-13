import { redirect } from "next/navigation";
import { auth0 } from "../../../libs/auth0";
import { ProfileWizardClientAdapter } from "./ProfileWizardClientAdapter";

export default async function ProfileRegisterPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const email = session.user?.email ?? "";

  return (
    <div className="min-h-screen bg-background text-foreground px-4 pt-12 pb-16">
      <div className="container mx-auto max-w-2xl">
        <ProfileWizardClientAdapter email={email} />
      </div>
    </div>
  );
}
