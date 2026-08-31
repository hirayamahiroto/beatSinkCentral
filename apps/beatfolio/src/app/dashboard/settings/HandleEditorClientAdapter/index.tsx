"use client";

import { useState } from "react";
import { InlineEditableField } from "@ui/design-system/components/molecules/InlineEditableField";
import { toast } from "@ui/design-system/components/atoms/Toaster";
import { useUpdateMyHandle } from "./hooks/useUpdateMyHandle";

type Props = {
  handle: string;
};

export const HandleEditorClientAdapter = ({ handle }: Props) => {
  const { update, isLoading } = useUpdateMyHandle();
  const [fieldError, setFieldError] = useState<string | null>(null);

  const save = async (newValue: string): Promise<boolean> => {
    setFieldError(null);
    const result = await update({ handle: newValue });

    if (result.ok) {
      toast.success("Handle を更新しました");
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
      label="Handle"
      htmlFor="handle"
      value={handle}
      prefix="@"
      isLoading={isLoading}
      error={fieldError}
      onSave={save}
    />
  );
};
