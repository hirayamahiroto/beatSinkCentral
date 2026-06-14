"use client";

import {
  ArtistProfileWizard,
  type WizardValues,
} from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { useSaveProfile } from "./hooks/useSaveProfile";

type Props = {
  email: string;
  defaultValues?: Partial<WizardValues>;
};

export const ProfileWizardClientAdapter = ({ email, defaultValues }: Props) => {
  const { submit, saveDraft, isLoading, error } = useSaveProfile();

  return (
    <ArtistProfileWizard
      email={email}
      defaultValues={defaultValues}
      isLoading={isLoading}
      error={error}
      onSubmit={async (data) => {
        await submit(data);
      }}
      onSaveDraft={(data) => {
        void saveDraft(data);
      }}
    />
  );
};
