import React from "react";
import { Label } from "@ui/design-system/components/atoms/Label";
import { Typography } from "@ui/design-system/components/atoms/Typography";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactElement;
};

export type { FormFieldProps };

export const FormField = ({
  label,
  htmlFor,
  hint,
  error,
  children,
}: FormFieldProps) => {
  const hasError = error !== undefined;
  const messageId = hasError
    ? `${htmlFor}-error`
    : hint !== undefined
      ? `${htmlFor}-hint`
      : undefined;

  const inputElement = React.cloneElement(
    children as React.ReactElement<Record<string, unknown>>,
    {
      id: htmlFor,
      "aria-invalid": hasError || undefined,
      "aria-describedby": messageId,
    },
  );

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {inputElement}
      {hasError ? (
        <Typography variant="small" tone="danger" id={messageId}>
          {error}
        </Typography>
      ) : hint !== undefined ? (
        <Typography variant="small" id={messageId}>
          {hint}
        </Typography>
      ) : null}
    </div>
  );
};
FormField.displayName = "FormField";
