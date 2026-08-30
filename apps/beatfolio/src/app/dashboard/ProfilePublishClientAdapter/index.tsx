"use client";

import { ProfilePublishControl } from "@ui/design-system/components/organisms/ProfilePublishControl";
import { usePublishProfile } from "./hooks/usePublishProfile";

type Props = {
  published: boolean;
  missingRequirements: string[];
};

export const ProfilePublishClientAdapter = ({
  published,
  missingRequirements,
}: Props) => {
  const { setPublished, isLoading, error, rejectedRequirements } =
    usePublishProfile();

  return (
    <ProfilePublishControl
      published={published}
      missingRequirements={rejectedRequirements ?? missingRequirements}
      isLoading={isLoading}
      error={error}
      onPublish={() => {
        void setPublished(true);
      }}
      onUnpublish={() => {
        void setPublished(false);
      }}
    />
  );
};
