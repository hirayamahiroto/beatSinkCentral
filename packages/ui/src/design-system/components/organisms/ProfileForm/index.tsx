import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Icon } from "@ui/design-system/components/atoms/Icon";
import { Input } from "@ui/design-system/components/atoms/Input";
import { Button } from "@ui/design-system/components/atoms/Button";
import { Card } from "@ui/design-system/components/atoms/Card";
import { Label } from "@ui/design-system/components/atoms/Label";
import { Stack } from "@ui/design-system/components/atoms/Stack";
import { Typography } from "@ui/design-system/components/atoms/Typography";

const profileFormSchema = z.object({
  accountId: z
    .string()
    .trim()
    .min(1, "アカウントIDを入力してください")
    .max(255, "255文字以内で入力してください")
    .regex(/^[a-zA-Z0-9_]+$/, "英数字とアンダースコア(_)のみ使用できます"),
});

type FormValues = z.infer<typeof profileFormSchema>;

type ProfileFormProps = {
  email: string;
  onSubmit: (data: FormValues) => Promise<void> | void;
  isLoading: boolean;
  error: string | null;
};

export const ProfileForm = ({
  email,
  onSubmit,
  isLoading,
  error,
}: ProfileFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onTouched",
    defaultValues: { accountId: "" },
  });

  const accountIdError = errors.accountId?.message;
  const hasValidationError = accountIdError !== undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack gap="lg">
        <Card>
          <Typography variant="small">ログイン中のアカウント</Typography>
          <Typography variant="p">{email}</Typography>
        </Card>

        <Card>
          <Label htmlFor="accountId">アカウントID</Label>
          {/* TODO: Icon を Input 内に表示する adornment 対応は別タスク */}
          <div>
            <Input
              id="accountId"
              type="text"
              placeholder="例: dj_taro_123"
              aria-invalid={hasValidationError}
              aria-describedby={
                hasValidationError ? "accountId-error" : "accountId-hint"
              }
              {...register("accountId")}
            />
          </div>
          {hasValidationError ? (
            <Typography variant="small" tone="danger" id="accountId-error">
              {accountIdError}
            </Typography>
          ) : (
            <Typography variant="small" id="accountId-hint">
              英数字とアンダースコア(_)、1〜255文字。後から変更できません
            </Typography>
          )}
        </Card>

        {error && (
          <Card>
            <Typography variant="p" tone="danger">
              {error}
            </Typography>
          </Card>
        )}

        <Button type="submit" disabled={isLoading || hasValidationError}>
          {isLoading ? (
            <>
              <Icon name="Loader2" />
              作成中...
            </>
          ) : (
            "プロフィールを作成"
          )}
        </Button>
      </Stack>
    </form>
  );
};
