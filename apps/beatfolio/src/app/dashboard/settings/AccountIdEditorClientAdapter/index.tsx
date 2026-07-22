"use client";

import { InlineEditableField } from "@ui/design-system/components/molecules/InlineEditableField";
import { useUpdateMyAccountId } from "./hooks/useUpdateMyAccountId";

type Props = {
  accountId: string;
};

export const AccountIdEditorClientAdapter = ({ accountId }: Props) => {
  const { update, isLoading, error } = useUpdateMyAccountId();

  return (
    <InlineEditableField
      label="Account ID"
      htmlFor="accountId"
      value={accountId}
      prefix="@"
      isLoading={isLoading}
      error={error}
      onSave={(newValue) => update({ accountId: newValue })}
    />
  );
};
