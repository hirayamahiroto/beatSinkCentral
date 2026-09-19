import type {
  SaveProgress,
  SaveSection,
} from "@ui/design-system/components/organisms/ArtistProfileWizard";
import type {
  SaveStep,
  SaveStepProgress,
} from "../../../../../../libs/saveProfileProgress";

const toSection = (step: SaveStep): SaveSection =>
  step === "attributes" || step === "links" ? step : "chapters";

export const toSaveProgress = (progress: SaveStepProgress): SaveProgress => {
  const failedSection = toSection(progress.failedAt);
  const savedSections = [...new Set(progress.saved.map(toSection))].filter(
    (section) => section !== failedSection,
  );
  return { savedSections, failedSection };
};
