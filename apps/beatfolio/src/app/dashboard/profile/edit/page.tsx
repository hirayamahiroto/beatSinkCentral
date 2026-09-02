import { redirect } from "next/navigation";
import { getProfileEditScreen } from "../../../../fetchers/dashboard/getProfileEditScreen";
import { ProfileWizardClientAdapter } from "./ProfileWizardClientAdapter";

export default async function ProfileEditPage() {
  const result = await getProfileEditScreen();

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  const screen = result.value;

  if (!screen.registered) {
    redirect("/onboarding");
  }

  const { email, linkTypeOptions, storyQuestions, defaultValues } = screen;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 pt-12 pb-16">
      <div className="container mx-auto max-w-2xl">
        <ProfileWizardClientAdapter
          email={email}
          linkTypeOptions={linkTypeOptions}
          storyQuestions={storyQuestions}
          defaultValues={defaultValues ?? undefined}
        />
      </div>
    </div>
  );
}
