"use client";

import {
  ArtistProfileWizard,
  type LinkTypeOption,
  type WizardValues,
} from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { useSaveProfile } from "./hooks/useSaveProfile";
import { uploadMyProfileImage } from "../../../../../fetchers/artists/uploadMyProfileImage";

type Props = {
  email: string;
  linkTypeOptions: LinkTypeOption[];
  defaultValues?: Partial<WizardValues>;
};

const uploadImage = async (file: File): Promise<string> => {
  const result = await uploadMyProfileImage(file);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.value.imageUrl;
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
      onUploadImage={uploadImage}
      onSaveDraft={(data) => {
        void saveDraft(data);
      }}
    />
  );
};
