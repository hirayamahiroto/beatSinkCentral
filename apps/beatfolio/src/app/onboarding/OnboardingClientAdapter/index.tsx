"use client";

import { ArtistProfile } from "@ui/design-system/components/organisms/ArtistProfile";
import { useCreateUser } from "./hooks/useCreateUser";

type Props = {
  email: string;
};

export const OnboardingClientAdapter = ({ email }: Props) => {
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
