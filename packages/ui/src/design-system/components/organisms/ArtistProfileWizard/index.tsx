import React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@ui/design-system/components/atoms/Button";
import { Card } from "@ui/design-system/components/atoms/Card";
import { Input } from "@ui/design-system/components/atoms/Input";
import { Textarea } from "@ui/design-system/components/atoms/Textarea";
import { Switch } from "@ui/design-system/components/atoms/Switch";
import { Typography } from "@ui/design-system/components/atoms/Typography";
import { FormField } from "@ui/design-system/components/molecules/FormField";
import { Stepper } from "@ui/design-system/components/molecules/Stepper";
import { TagInput } from "@ui/design-system/components/molecules/TagInput";

const wizardSchema = z.object({
  name: z.string().trim().min(1, "活動名を入力してください").max(255),
  imageUrl: z.string().trim().url("画像URLを入力してください"),
  tagline: z
    .string()
    .trim()
    .min(1, "タグラインを入力してください")
    .max(60, "60文字以内で入力してください"),
  genres: z.array(z.string()).min(1, "ジャンルを1つ以上追加してください"),
  storyOrigin: z.string().trim().min(1, "この問いに答えてください"),
  storyTurning: z.string().trim().optional(),
  storyNow: z.string().trim().optional(),
  location: z.string().trim().optional(),
  activityForm: z.enum(["solo", "unit", "crew"]),
  affiliation: z.string().trim().optional(),
  links: z
    .array(
      z.object({
        type: z.string().trim().min(1, "種別を選択してください"),
        url: z.string().trim().url("URLを入力してください"),
      }),
    )
    .min(1, "SNS / 配信リンクを1つ以上登録してください"),
  published: z.boolean(),
});

type WizardValues = z.infer<typeof wizardSchema>;

export type { WizardValues };

type LinkTypeOption = {
  type: string;
  label: string;
};

export type { LinkTypeOption };

type ArtistProfileWizardProps = {
  email: string;
  linkTypeOptions: LinkTypeOption[];
  defaultValues?: Partial<WizardValues>;
  onSubmit: (data: WizardValues) => Promise<void> | void;
  onSaveDraft?: (data: WizardValues) => void;
  isLoading?: boolean;
  error?: string | null;
};

const STEP_LABELS = ["基本", "Story", "活動", "リンク", "確認"];
const TOTAL = STEP_LABELS.length;

const STEP_FIELDS: Record<number, (keyof WizardValues)[]> = {
  1: ["name", "imageUrl", "tagline", "genres"],
  2: ["storyOrigin"],
  3: [],
  4: ["links"],
  5: [],
};

const nativeSelectClass =
  "h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const ArtistProfileWizard = ({
  email,
  linkTypeOptions,
  defaultValues,
  onSubmit,
  onSaveDraft,
  isLoading = false,
  error = null,
}: ArtistProfileWizardProps) => {
  const [step, setStep] = React.useState(1);
  const [defaultLinkType] = linkTypeOptions;

  const {
    register,
    control,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      imageUrl: "",
      tagline: "",
      genres: [],
      storyOrigin: "",
      storyTurning: "",
      storyNow: "",
      location: "",
      activityForm: "solo",
      affiliation: "",
      links: defaultLinkType ? [{ type: defaultLinkType.type, url: "" }] : [],
      published: false,
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "links" });

  const goNext = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (!valid) return;
    if (step < TOTAL) {
      onSaveDraft?.(getValues());
      setStep(step + 1);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="mb-2 flex items-center justify-between">
        <Typography variant="small" tone="muted">
          ステップ {step} / {TOTAL}
        </Typography>
        <button
          type="button"
          onClick={() => onSaveDraft?.(getValues())}
          className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          途中保存して終了
        </button>
      </div>
      <Stepper steps={STEP_LABELS} current={step} />

      <div className="mt-3 text-center">
        <Typography variant="small" tone="muted">
          ログイン中: {email}
        </Typography>
      </div>

      <div className="mt-6 pb-32">
        {step === 1 && (
          <Card>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <Typography variant="h4">
                  まず、あなたの「顔」を作りましょう
                </Typography>
                <Typography variant="small" tone="muted">
                  一覧やシェア時に最初に目に入る情報です。
                </Typography>
              </div>

              <FormField
                label="活動名"
                htmlFor="name"
                error={errors.name?.message}
              >
                <Input placeholder="例: SAKU" {...register("name")} />
              </FormField>

              <FormField
                label="アーティスト写真（URL）"
                htmlFor="imageUrl"
                hint="画像URLを貼り付け（アップロードは後日対応）"
                error={errors.imageUrl?.message}
              >
                <Input placeholder="https://..." {...register("imageUrl")} />
              </FormField>

              <FormField
                label="タグライン"
                htmlFor="tagline"
                hint="活動を一行で（OGPの説明文にも）"
                error={errors.tagline?.message}
              >
                <Input
                  placeholder="例: 口ひとつで、フロアを揺らす。"
                  {...register("tagline")}
                />
              </FormField>

              <Controller
                control={control}
                name="genres"
                render={({ field }) => (
                  <FormField
                    label="ジャンル / スタイル"
                    htmlFor="genres"
                    hint="入力して Enter で追加・複数可"
                    error={errors.genres?.message}
                  >
                    <TagInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="例: Beatbox"
                    />
                  </FormField>
                )}
              />
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <Typography variant="h4">
                  あなたの背景を聞かせてください
                </Typography>
                <Typography variant="small" tone="muted">
                  ここが一番読まれる部分です。うまく書こうとしなくて大丈夫。問いに答えるだけでOK。
                </Typography>
              </div>

              <FormField
                label="なぜビートボックスを始めたのか"
                htmlFor="storyOrigin"
                error={errors.storyOrigin?.message}
              >
                <Textarea
                  rows={4}
                  placeholder="きっかけや原体験を、思い出すままに。"
                  {...register("storyOrigin")}
                />
              </FormField>

              <FormField label="転機になった出来事" htmlFor="storyTurning">
                <Textarea
                  rows={4}
                  placeholder="続ける理由が変わった瞬間、悔しかったこと、嬉しかったこと。"
                  {...register("storyTurning")}
                />
              </FormField>

              <FormField label="今、目指していること" htmlFor="storyNow">
                <Textarea
                  rows={4}
                  placeholder="これからどうなりたいか。どんなシーンを作りたいか。"
                  {...register("storyNow")}
                />
              </FormField>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <Typography variant="h4">活動について（任意）</Typography>
                <Typography variant="small" tone="muted">
                  スキップしてもOK。あとから足せます。
                </Typography>
              </div>

              <FormField label="活動拠点" htmlFor="location">
                <Input placeholder="例: 東京" {...register("location")} />
              </FormField>

              <div className="flex flex-col gap-2">
                <Typography variant="small">活動形態</Typography>
                <select
                  className={nativeSelectClass}
                  {...register("activityForm")}
                >
                  <option value="solo">ソロ</option>
                  <option value="unit">ユニット</option>
                  <option value="crew">バンド / クルー</option>
                </select>
              </div>

              <FormField label="所属" htmlFor="affiliation">
                <Input
                  placeholder="例: 独立 / クルー名"
                  {...register("affiliation")}
                />
              </FormField>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <Typography variant="h4">追える場所を教えてください</Typography>
                <Typography variant="small" tone="muted">
                  最低1つ。見た人をあなたの活動へ送り出します。
                </Typography>
              </div>

              <div className="flex flex-col gap-3">
                {fields.map((row, index) => (
                  <div key={row.id} className="flex items-start gap-3">
                    <select
                      className={nativeSelectClass}
                      aria-label="リンクの種別"
                      {...register(`links.${index}.type` as const)}
                    >
                      {linkTypeOptions.map((option) => (
                        <option key={option.type} value={option.type}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-1 flex-col gap-1">
                      <Input
                        placeholder="https://..."
                        {...register(`links.${index}.url` as const)}
                      />
                      {errors.links?.[index]?.url && (
                        <Typography variant="small" tone="danger">
                          {errors.links[index]?.url?.message}
                        </Typography>
                      )}
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        aria-label="リンクを削除"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {typeof errors.links?.message === "string" && (
                <Typography variant="small" tone="danger">
                  {errors.links.message}
                </Typography>
              )}

              {defaultLinkType && (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({ type: defaultLinkType.type, url: "" })
                    }
                  >
                    ＋ リンクを追加
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {step === 5 && (
          <Card>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <Typography variant="h4">最後に確認して公開</Typography>
                <Typography variant="small" tone="muted">
                  準備ができたら公開しましょう。オフなら下書きとして保存されます。
                </Typography>
              </div>

              <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-1">
                  <Typography variant="p">今すぐ公開する</Typography>
                  <Typography variant="small" tone="muted">
                    必須項目が揃うと公開できます
                  </Typography>
                </div>
                <Controller
                  control={control}
                  name="published"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="公開する"
                    />
                  )}
                />
              </div>

              {error && (
                <Typography variant="small" tone="danger">
                  {error}
                </Typography>
              )}
            </div>
          </Card>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
          >
            戻る
          </Button>
          <div className="flex-1" />
          {step < TOTAL ? (
            <Button type="button" onClick={goNext}>
              次へ
            </Button>
          ) : (
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "保存中..." : "保存して公開する"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};
ArtistProfileWizard.displayName = "ArtistProfileWizard";
