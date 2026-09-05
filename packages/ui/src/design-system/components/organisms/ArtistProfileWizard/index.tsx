import React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@ui/design-system/components/atoms/Button";
import { Card } from "@ui/design-system/components/atoms/Card";
import { Input } from "@ui/design-system/components/atoms/Input";
import { Textarea } from "@ui/design-system/components/atoms/Textarea";
import { Typography } from "@ui/design-system/components/atoms/Typography";
import { FormField } from "@ui/design-system/components/molecules/FormField";
import { ImageFileInput } from "@ui/design-system/components/molecules/ImageFileInput";
import { Stepper } from "@ui/design-system/components/molecules/Stepper";
import { TagInput } from "@ui/design-system/components/molecules/TagInput";

const IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const CHAPTER_BODY_PLACEHOLDER =
  "自由に書いてください。うまく書こうとしなくて大丈夫。";

const baseWizardSchema = z.object({
  name: z.string().trim().min(1, "活動名を入力してください").max(255),
  imageUrl: z.string().trim().url("画像をアップロードしてください"),
  tagline: z.string().trim().max(60, "60文字以内で入力してください").optional(),
  genres: z.array(z.string()).min(1, "ジャンルを1つ以上追加してください"),
  chapters: z.record(z.string(), z.string()),
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
});

type WizardValues = z.infer<typeof baseWizardSchema>;

export type { WizardValues };

const hasAnsweredRequiredChapter = (
  chapters: Record<string, string>,
  requiredChapterCode: string,
): boolean => {
  const body = chapters[requiredChapterCode];
  return body !== undefined && body.trim().length > 0;
};

const buildWizardSchema = (requiredChapterCode: string | undefined) =>
  baseWizardSchema.refine(
    (value) =>
      requiredChapterCode === undefined ||
      hasAnsweredRequiredChapter(value.chapters, requiredChapterCode),
    {
      message: "この問いに答えてください",
      path:
        requiredChapterCode === undefined
          ? ["chapters"]
          : ["chapters", requiredChapterCode],
    },
  );

type LinkTypeOption = {
  type: string;
  label: string;
};

export type { LinkTypeOption };

type StoryQuestionOption = {
  code: string;
  label: string;
  required: boolean;
};

export type { StoryQuestionOption };

const toDefaultChapters = (
  storyQuestions: StoryQuestionOption[],
  existing: Record<string, string> | undefined,
): Record<string, string> =>
  Object.fromEntries(
    storyQuestions.map((question) => {
      const body = existing?.[question.code];
      return [question.code, body === undefined ? "" : body];
    }),
  );

export type SaveSection = "attributes" | "chapters" | "links";

export type SaveProgress = {
  savedSections: SaveSection[];
  failedSection: SaveSection;
};

const SAVE_SECTION_LABELS: Record<SaveSection, string> = {
  attributes: "基本・活動",
  chapters: "Story",
  links: "リンク",
};

const describeSaveProgress = (progress: SaveProgress): string => {
  const failed = SAVE_SECTION_LABELS[progress.failedSection];
  if (progress.savedSections.length === 0) {
    return `${failed}の保存に失敗したため、まだ何も保存されていません。`;
  }
  const saved = progress.savedSections
    .map((section) => SAVE_SECTION_LABELS[section])
    .join("・");
  return `${saved}は保存済みです。${failed}の保存に失敗しました。もう一度保存すると全体が反映されます。`;
};

type ArtistProfileWizardProps = {
  email: string;
  linkTypeOptions: LinkTypeOption[];
  storyQuestions: StoryQuestionOption[];
  defaultValues?: Partial<WizardValues>;
  onSubmit: (data: WizardValues) => Promise<void> | void;
  onUploadImage: (file: File) => Promise<string>;
  onSaveDraft?: (data: WizardValues) => void;
  isLoading?: boolean;
  error?: string | null;
  saveProgress?: SaveProgress | null;
};

const STEP_LABELS = ["基本", "Story", "活動", "リンク", "確認"];
const TOTAL = STEP_LABELS.length;

const STEP_FIELDS: Record<number, (keyof WizardValues)[]> = {
  1: ["name", "imageUrl", "tagline", "genres"],
  2: ["chapters"],
  3: [],
  4: ["links"],
  5: [],
};

const nativeSelectClass =
  "h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const ArtistProfileWizard = ({
  email,
  linkTypeOptions,
  storyQuestions,
  defaultValues,
  onSubmit,
  onUploadImage,
  onSaveDraft,
  isLoading = false,
  error = null,
  saveProgress = null,
}: ArtistProfileWizardProps) => {
  const [step, setStep] = React.useState(1);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [imageUploadError, setImageUploadError] = React.useState<string | null>(
    null,
  );
  const [defaultLinkType] = linkTypeOptions;
  const requiredChapterCode = storyQuestions.find(
    (question) => question.required,
  )?.code;
  const wizardSchema = React.useMemo(
    () => buildWizardSchema(requiredChapterCode),
    [requiredChapterCode],
  );

  const {
    register,
    control,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      imageUrl: "",
      tagline: "",
      genres: [],
      chapters: toDefaultChapters(storyQuestions, defaultValues?.chapters),
      location: "",
      activityForm: "solo",
      affiliation: "",
      links: defaultLinkType ? [{ type: defaultLinkType.type, url: "" }] : [],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "links" });

  const goNext = async () => {
    if (isUploadingImage) return;
    const valid = await trigger(STEP_FIELDS[step]);
    if (!valid) return;
    if (step < TOTAL) {
      onSaveDraft?.(getValues());
      setStep(step + 1);
    }
  };

  const saveDraft = () => {
    if (isUploadingImage) return;
    onSaveDraft?.(getValues());
  };

  const submit = async (data: WizardValues) => {
    if (isUploadingImage) return;
    await onSubmit(data);
  };

  const handleImageSelect = async (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageUploadError("JPEG / PNG / WebP の画像を選択してください");
      return;
    }
    if (file.size > IMAGE_MAX_SIZE_BYTES) {
      setImageUploadError("5MB以下の画像を選択してください");
      return;
    }

    setIsUploadingImage(true);
    setImageUploadError(null);
    try {
      const imageUrl = await onUploadImage(file);
      setValue("imageUrl", imageUrl, {
        shouldValidate: true,
        shouldDirty: true,
      });
    } catch (uploadError) {
      setImageUploadError(
        uploadError instanceof Error
          ? uploadError.message
          : "画像のアップロードに失敗しました",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <div className="mb-2 flex items-center justify-between">
        <Typography variant="small" tone="muted">
          ステップ {step} / {TOTAL}
        </Typography>
        <button
          type="button"
          onClick={saveDraft}
          disabled={isUploadingImage}
          className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-muted-foreground"
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

              <Controller
                control={control}
                name="imageUrl"
                render={({ field }) => (
                  <FormField
                    label="アーティスト写真"
                    htmlFor="imageUrl"
                    hint="JPEG / PNG / WebP、5MBまで"
                    error={imageUploadError ?? errors.imageUrl?.message}
                  >
                    <ImageFileInput
                      value={field.value === "" ? null : field.value}
                      onFileSelect={handleImageSelect}
                      isUploading={isUploadingImage}
                      accept={ACCEPTED_IMAGE_TYPES.join(",")}
                    />
                  </FormField>
                )}
              />

              <FormField
                label="タグライン（任意）"
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

              {storyQuestions.map((question) => (
                <FormField
                  key={question.code}
                  label={
                    question.required
                      ? question.label
                      : `${question.label}（任意）`
                  }
                  htmlFor={`chapters.${question.code}`}
                  error={errors.chapters?.[question.code]?.message}
                >
                  <Textarea
                    rows={4}
                    placeholder={CHAPTER_BODY_PLACEHOLDER}
                    {...register(`chapters.${question.code}` as const)}
                  />
                </FormField>
              ))}
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
                <Typography variant="h4">最後に確認して保存</Typography>
                <Typography variant="small" tone="muted">
                  保存しただけでは公開されません。公開はダッシュボードから切り替えます。
                </Typography>
              </div>

              {error && (
                <Typography variant="small" tone="danger">
                  {error}
                </Typography>
              )}
              {saveProgress && (
                <Typography variant="small" tone="muted">
                  {describeSaveProgress(saveProgress)}
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
            <Button type="button" onClick={goNext} disabled={isUploadingImage}>
              次へ
            </Button>
          ) : (
            <Button type="submit" disabled={isLoading || isUploadingImage}>
              {isLoading ? "保存中..." : "保存する"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};
ArtistProfileWizard.displayName = "ArtistProfileWizard";
