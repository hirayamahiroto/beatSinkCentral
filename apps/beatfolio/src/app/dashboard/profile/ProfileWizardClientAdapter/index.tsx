"use client";

import {
  ArtistProfileWizard,
  type WizardValues,
} from "@ui/design-system/components/organisms/ArtistProfileWizard";

type Props = {
  email: string;
};

export const ProfileWizardClientAdapter = ({ email }: Props) => {
  // モック: 送信・下書き保存は未配線（プロフィール CRUD API は後続 #160）
  const handleSubmit = (data: WizardValues) => {
    console.log("[mock] submit profile", data);
    window.alert("（モック）プロフィールを保存しました");
  };

  const handleSaveDraft = (data: WizardValues) => {
    console.log("[mock] save draft", data);
  };

  return (
    <ArtistProfileWizard
      email={email}
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
    />
  );
};
