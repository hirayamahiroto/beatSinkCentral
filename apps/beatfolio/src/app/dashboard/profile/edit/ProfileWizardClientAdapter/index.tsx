"use client";

import {
  ArtistProfileWizard,
  type LinkTypeOption,
  type WizardValues,
} from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { useSaveProfile } from "./hooks/useSaveProfile";

type Props = {
  email: string;
  linkTypeOptions: LinkTypeOption[];
  defaultValues?: Partial<WizardValues>;
};

export const ProfileWizardClientAdapter = ({
  email,
  linkTypeOptions,
  defaultValues,
}: Props) => {
  const { submit, saveDraft, isLoading, error } = useSaveProfile();

  return (
    <ArtistProfileWizard
      email={email}
      linkTypeOptions={linkTypeOptions}
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
