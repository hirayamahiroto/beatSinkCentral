"use client";

import { InlineEditableField } from "@ui/design-system/components/molecules/InlineEditableField";
import { useUpdateMyEmail } from "./hooks/useUpdateMyEmail";

type Props = {
  email: string;
};

export const EmailEditorClientAdapter = ({ email }: Props) => {
  const { update, isLoading, error } = useUpdateMyEmail();

  return (
    <InlineEditableField
      label="Email"
      htmlFor="email"
      value={email}
      inputType="email"
      isLoading={isLoading}
      error={error}
      onSave={(newValue) => update({ email: newValue })}
    />
  );
};
