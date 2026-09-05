import { z } from "zod";
import type {
  SaveProgress,
  SaveSection,
} from "@ui/design-system/components/organisms/ArtistProfileWizard";

const CHAPTER_STEP_PREFIX = "chapter:";

export type SaveStep =
  | "attributes"
  | `${typeof CHAPTER_STEP_PREFIX}${string}`
  | "links";

export type SaveStepProgress = {
  saved: readonly SaveStep[];
  failedAt: SaveStep;
};

const isSaveStep = (value: unknown): boolean =>
  typeof value === "string" &&
  (value === "attributes" ||
    value === "links" ||
    (value.startsWith(CHAPTER_STEP_PREFIX) &&
      value.length > CHAPTER_STEP_PREFIX.length));

export const saveStepSchema = z.custom<SaveStep>(isSaveStep);

export const saveStepProgressSchema = z.object({
  saved: z.array(saveStepSchema),
  failedAt: saveStepSchema,
});

export const chapterStep = (questionCode: string): SaveStep =>
  `${CHAPTER_STEP_PREFIX}${questionCode}`;

const toSection = (step: SaveStep): SaveSection =>
  step === "attributes" || step === "links" ? step : "chapters";

export const toSaveProgress = (progress: SaveStepProgress): SaveProgress => {
  const failedSection = toSection(progress.failedAt);
  const savedSections = [...new Set(progress.saved.map(toSection))].filter(
    (section) => section !== failedSection,
  );
  return { savedSections, failedSection };
};
