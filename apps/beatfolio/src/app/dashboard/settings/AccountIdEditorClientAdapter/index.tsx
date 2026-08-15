"use client";

import { useState } from "react";
import { InlineEditableField } from "@ui/design-system/components/molecules/InlineEditableField";
import { toast } from "@ui/design-system/components/atoms/Toaster";
import { useUpdateMyAccountId } from "./hooks/useUpdateMyAccountId";

type Props = {
  accountId: string;
};

export const AccountIdEditorClientAdapter = ({ accountId }: Props) => {
  const { update, isLoading } = useUpdateMyAccountId();
  const [fieldError, setFieldError] = useState<string | null>(null);

  const save = async (newValue: string): Promise<boolean> => {
    setFieldError(null);
    const result = await update({ accountId: newValue });

    if (result.ok) {
      toast.success("Account ID を更新しました");
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
      label="Account ID"
      htmlFor="accountId"
      value={accountId}
      prefix="@"
      isLoading={isLoading}
      error={fieldError}
      onSave={save}
    />
  );
};
