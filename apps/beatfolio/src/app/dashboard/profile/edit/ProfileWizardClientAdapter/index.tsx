"use client";

import {
  ArtistProfileWizard,
  type LinkTypeOption,
  type WizardValues,
} from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { useSaveProfile } from "./hooks/useSaveProfile";
import { useUploadProfileImage } from "./hooks/useUploadProfileImage";

type Props = {
  email: string;
  artistId: string;
  linkTypeOptions: LinkTypeOption[];
  defaultValues?: Partial<WizardValues>;
};

export const ProfileWizardClientAdapter = ({
  email,
  artistId,
  linkTypeOptions,
  defaultValues,
}: Props) => {
  const { submit, saveDraft, isLoading, error } = useSaveProfile();
  const { uploadImage } = useUploadProfileImage();

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
      onUploadImage={(file) => uploadImage(artistId, file)}
      onSaveDraft={(data) => {
        void saveDraft(data);
      }}
    />
  );
};
