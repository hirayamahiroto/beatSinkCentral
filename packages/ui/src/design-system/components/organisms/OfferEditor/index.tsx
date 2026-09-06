import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@ui/design-system/components/atoms/Button";
import { Card } from "@ui/design-system/components/atoms/Card";
import { Input } from "@ui/design-system/components/atoms/Input";
import { Stack } from "@ui/design-system/components/atoms/Stack";
import { Textarea } from "@ui/design-system/components/atoms/Textarea";
import { Typography } from "@ui/design-system/components/atoms/Typography";
import { FormField } from "@ui/design-system/components/molecules/FormField";

const MAX_CO_PERFORMERS = 20;

const offerEditorSchema = z.object({
  date: z.string().trim().min(1, "開催日を入力してください"),
  place: z
    .string()
    .trim()
    .min(1, "場所を入力してください")
    .max(255, "255文字以内で入力してください"),
  ticketUrl: z.string().trim().url("チケットのURLを入力してください"),
  comment: z
    .string()
    .trim()
    .min(1, "一言を入力してください")
    .max(500, "500文字以内で入力してください"),
  coPerformers: z
    .array(
      z.object({
        name: z
          .string()
          .trim()
          .min(1, "名前を入力してください")
          .max(255, "255文字以内で入力してください"),
        handle: z
          .string()
          .trim()
          .max(255, "255文字以内で入力してください")
          .regex(
            /^[a-zA-Z0-9_]*$/,
            "ハンドルは英数字とアンダースコアで入力してください",
          ),
      }),
    )
    .max(MAX_CO_PERFORMERS, `共演者は${MAX_CO_PERFORMERS}人までです`),
});

type OfferEditorValues = z.infer<typeof offerEditorSchema>;

export type { OfferEditorValues };

type OfferEditorProps = {
  defaultValues: OfferEditorValues | null;
  isLoading: boolean;
  error: string | null;
  onSubmit: (values: OfferEditorValues) => Promise<void> | void;
};

const EMPTY_VALUES: OfferEditorValues = {
  date: "",
  place: "",
  ticketUrl: "",
  comment: "",
  coPerformers: [],
};

export const OfferEditor = ({
  defaultValues,
  isLoading,
  error,
  onSubmit,
}: OfferEditorProps) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OfferEditorValues>({
    resolver: zodResolver(offerEditorSchema),
    mode: "onTouched",
    defaultValues: defaultValues ?? EMPTY_VALUES,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "coPerformers",
  });

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="md">
          <Stack gap="sm">
            <Typography variant="h4">次のライブ</Typography>
            <Typography variant="small" tone="muted">
              {defaultValues === null
                ? "登録すると公開ページに案内が出ます。開催日を過ぎると表示は自動で消えます。"
                : "公開ページに表示中です。内容を書き換えて保存すると差し替わります。"}
            </Typography>
          </Stack>

          <FormField
            label="開催日"
            htmlFor="offer-date"
            error={errors.date?.message}
          >
            <Input type="date" {...register("date")} />
          </FormField>

          <FormField
            label="場所"
            htmlFor="offer-place"
            error={errors.place?.message}
          >
            <Input placeholder="例: 渋谷 WWW" {...register("place")} />
          </FormField>

          <FormField
            label="チケットのURL"
            htmlFor="offer-ticket-url"
            error={errors.ticketUrl?.message}
          >
            <Input
              type="url"
              placeholder="https://..."
              {...register("ticketUrl")}
            />
          </FormField>

          <FormField
            label="一言"
            htmlFor="offer-comment"
            hint="来てほしい理由を一言で。公開ページのボタンの横に出ます"
            error={errors.comment?.message}
          >
            <Textarea
              rows={3}
              placeholder="例: この日は新曲を初めてやります"
              {...register("comment")}
            />
          </FormField>

          <Stack gap="sm">
            <Typography variant="small">共演者（任意）</Typography>
            {fields.map((row, index) => (
              <div key={row.id} className="flex items-start gap-3">
                <div className="flex flex-1 flex-col gap-1">
                  <Input
                    placeholder="名前"
                    aria-label="共演者の名前"
                    {...register(`coPerformers.${index}.name` as const)}
                  />
                  {errors.coPerformers?.[index]?.name && (
                    <Typography variant="small" tone="danger">
                      {errors.coPerformers[index]?.name?.message}
                    </Typography>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <Input
                    placeholder="beatfolio のハンドル（登録済みなら）"
                    aria-label="共演者の beatfolio ハンドル"
                    {...register(`coPerformers.${index}.handle` as const)}
                  />
                  {errors.coPerformers?.[index]?.handle && (
                    <Typography variant="small" tone="danger">
                      {errors.coPerformers[index]?.handle?.message}
                    </Typography>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  aria-label="共演者を削除"
                >
                  ×
                </Button>
              </div>
            ))}
            {typeof errors.coPerformers?.message === "string" && (
              <Typography variant="small" tone="danger">
                {errors.coPerformers.message}
              </Typography>
            )}
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={fields.length >= MAX_CO_PERFORMERS}
                onClick={() => append({ name: "", handle: "" })}
              >
                ＋ 共演者を追加
              </Button>
            </div>
          </Stack>

          {error && (
            <div role="alert">
              <Typography variant="small" tone="danger">
                {error}
              </Typography>
            </div>
          )}

          <div>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "保存中..."
                : defaultValues === null
                  ? "オファーを登録する"
                  : "オファーを差し替える"}
            </Button>
          </div>
        </Stack>
      </form>
    </Card>
  );
};
OfferEditor.displayName = "OfferEditor";
