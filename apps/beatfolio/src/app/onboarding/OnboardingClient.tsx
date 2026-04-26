"use client";

import { ProfileForm } from "@ui/design-system/components/organisms/ProfileForm";
import { useCreateUser } from "./hooks/useCreateUser";

type OnboardingClientProps = {
  email: string;
};

export const OnboardingClient = ({ email }: OnboardingClientProps) => {
  const { handleSubmit, isLoading, error } = useCreateUser({ email });

  return (
    <ProfileForm
      email={email}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  );
};
