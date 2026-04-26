import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Icon } from "@ui/design-system/components/atoms/Icon";
import { Input } from "@ui/design-system/components/atoms/Input";
import { Button } from "@ui/design-system/components/atoms/Button";
import { Card } from "@ui/design-system/components/atoms/Card";
import { Label } from "@ui/design-system/components/atoms/Label";

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Card className="p-4 bg-white/5 border-white/10 rounded-xl shadow-none">
        <p className="text-sm text-gray-400 mb-1">ログイン中のアカウント</p>
        <p className="text-white font-medium">{email}</p>
      </Card>

      <Card className="p-4 bg-transparent border-none shadow-none">
        <Label htmlFor="accountId" className="block text-gray-300 mb-2">
          アカウントID
        </Label>
        <div className="relative">
          <Icon
            name="AtSign"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10"
          />
          <Input
            id="accountId"
            type="text"
            placeholder="例: dj_taro_123"
            aria-invalid={hasValidationError}
            aria-describedby={
              hasValidationError ? "accountId-error" : "accountId-hint"
            }
            {...register("accountId")}
            className="pl-10 pr-4 py-3 h-auto bg-white/10 border-white/20 rounded-xl text-white placeholder-gray-500 focus-visible:ring-blue-500 focus-visible:ring-offset-0 aria-[invalid=true]:border-red-400/60"
          />
        </div>
        {hasValidationError ? (
          <p id="accountId-error" className="mt-2 text-sm text-red-400">
            {accountIdError}
          </p>
        ) : (
          <p id="accountId-hint" className="mt-2 text-sm text-gray-500">
            英数字とアンダースコア(_)、1〜255文字。後から変更できません
          </p>
        )}
      </Card>

      {error && (
        <Card className="p-4 bg-red-500/10 border-red-500/20 rounded-xl shadow-none">
          <p className="text-red-400 text-sm">{error}</p>
        </Card>
      )}

      <Button
        type="submit"
        disabled={isLoading || hasValidationError}
        className="w-full py-3 h-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 rounded-xl font-medium"
      >
        {isLoading ? (
          <>
            <Icon name="Loader2" className="w-5 h-5 animate-spin" />
            作成中...
          </>
        ) : (
          "プロフィールを作成"
        )}
      </Button>
    </form>
  );
};
