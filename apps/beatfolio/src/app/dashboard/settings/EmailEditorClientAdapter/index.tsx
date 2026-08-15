"use client";

import { useState } from "react";
import { InlineEditableField } from "@ui/design-system/components/molecules/InlineEditableField";
import { toast } from "@ui/design-system/components/atoms/Toaster";
import { useUpdateMyEmail } from "./hooks/useUpdateMyEmail";

type Props = {
  email: string;
};

export const EmailEditorClientAdapter = ({ email }: Props) => {
  const { update, isLoading } = useUpdateMyEmail();
  const [fieldError, setFieldError] = useState<string | null>(null);

  const save = async (newValue: string): Promise<boolean> => {
    setFieldError(null);
    const result = await update({ email: newValue });

    if (result.ok) {
      toast.success("メールアドレスを更新しました");
      return true;
    }

    if (result.error.kind === "rejected") {
      setFieldError(result.error.message);
    } else {
      toast.error(result.error.message);
    }
    return false;
  };

  return (
    <InlineEditableField
      label="Email"
      htmlFor="email"
      value={email}
      inputType="email"
      isLoading={isLoading}
      error={fieldError}
      onSave={save}
    />
  );
};
