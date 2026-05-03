"use client";

import { ArtistProfile } from "@ui/design-system/components/organisms/ArtistProfile";
import { useCreateUser } from "./hooks/useCreateUser";

type OnboardingClientProps = {
  email: string;
};

export const OnboardingClient = ({ email }: OnboardingClientProps) => {
  const { handleSubmit, isLoading, error } = useCreateUser({ email });

  return (
    <ArtistProfile
      email={email}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  );
};
