import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Icon } from "@ui/design-system/components/atoms/Icon";
import { Input } from "@ui/design-system/components/atoms/Input";
import { Button } from "@ui/design-system/components/atoms/Button";
import { Card } from "@ui/design-system/components/atoms/Card";
import { Stack } from "@ui/design-system/components/atoms/Stack";
import { Typography } from "@ui/design-system/components/atoms/Typography";
import { FormField } from "@ui/design-system/components/molecules/FormField";

const artistProfileSchema = z.object({
  accountId: z
    .string()
    .trim()
    .min(1, "アカウントIDを入力してください")
    .max(255, "255文字以内で入力してください")
    .regex(/^[a-zA-Z0-9_]+$/, "英数字とアンダースコア(_)のみ使用できます"),
});

type FormValues = z.infer<typeof artistProfileSchema>;

type ArtistProfileProps = {
  email: string;
  onSubmit: (data: FormValues) => Promise<void> | void;
  isLoading: boolean;
  error: string | null;
};

export const ArtistProfile = ({
  email,
  onSubmit,
  isLoading,
  error,
}: ArtistProfileProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(artistProfileSchema),
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
          <FormField
            label="アカウントID"
            htmlFor="accountId"
            hint="英数字とアンダースコア(_)、1〜255文字。後から変更できません"
            error={accountIdError}
          >
            <Input
              type="text"
              placeholder="例: dj_taro_123"
              {...register("accountId")}
            />
          </FormField>
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
