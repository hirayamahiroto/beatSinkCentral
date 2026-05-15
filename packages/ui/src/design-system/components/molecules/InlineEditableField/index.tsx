import React, { useState } from "react";
import { Card } from "@ui/design-system/components/atoms/Card";
import { Stack } from "@ui/design-system/components/atoms/Stack";
import { Label } from "@ui/design-system/components/atoms/Label";
import { Input } from "@ui/design-system/components/atoms/Input";
import { Button } from "@ui/design-system/components/atoms/Button";
import { Typography } from "@ui/design-system/components/atoms/Typography";

type InlineEditableFieldProps = {
  label: string;
  value: string;
  htmlFor: string;
  prefix?: string;
  inputType?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  isLoading: boolean;
  error?: string | null;
  onSave: (newValue: string) => Promise<boolean> | boolean;
};

export type { InlineEditableFieldProps };

export const InlineEditableField = ({
  label,
  value,
  htmlFor,
  prefix,
  inputType = "text",
  placeholder,
  isLoading,
  error,
  onSave,
}: InlineEditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const startEdit = () => {
    setDraft(value);
    setIsEditing(true);
  };

  const cancel = () => {
    setIsEditing(false);
    setDraft(value);
  };

  const save = async () => {
    const trimmed = draft.trim();
    if (trimmed === "" || trimmed === value) {
      setIsEditing(false);
      return;
    }
    const ok = await onSave(trimmed);
    if (ok) {
      setIsEditing(false);
    }
  };

  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <Card>
      <Stack gap="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="flex-1 min-w-0 w-full">
            <Stack gap="sm">
              <Label htmlFor={htmlFor}>{label}</Label>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  {prefix ? (
                    <Typography variant="p" aria-hidden>
                      {prefix}
                    </Typography>
                  ) : null}
                  <Input
                    id={htmlFor}
                    type={inputType}
                    value={draft}
                    placeholder={placeholder}
                    disabled={isLoading}
                    onChange={(e) => setDraft(e.target.value)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={errorId}
                    autoFocus
                  />
                </div>
              ) : (
                <Typography variant="p" id={htmlFor}>
                  {prefix ?? ""}
                  {value}
                </Typography>
              )}
            </Stack>
          </div>
          <div className="flex gap-2 justify-end sm:shrink-0">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={cancel}
                  disabled={isLoading}
                >
                  キャンセル
                </Button>
                <Button type="button" onClick={save} disabled={isLoading}>
                  {isLoading ? "保存中..." : "保存"}
                </Button>
              </>
            ) : (
              <Button type="button" variant="outline" onClick={startEdit}>
                変更
              </Button>
            )}
          </div>
        </div>
        {error ? (
          <Typography variant="small" tone="danger" id={errorId} role="alert">
            {error}
          </Typography>
        ) : null}
      </Stack>
    </Card>
  );
};

InlineEditableField.displayName = "InlineEditableField";
