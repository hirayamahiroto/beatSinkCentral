import type { WizardValues } from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { composeActivityInfo } from "../../../../../../libs/activityInfo";

export type SaveProfileRequest = {
  name: string;
  tagline: string | null;
  imageUrl: string;
  chapters: { questionCode: string; body: string }[];
  activityInfo: string;
  genres: string[];
  links: { type: string; url: string }[];
};

const toChapters = (
  values: WizardValues,
): { questionCode: string; body: string }[] =>
  Object.entries(values.chapters).flatMap(([questionCode, body]) => {
    const trimmed = body.trim();
    return trimmed.length > 0 ? [{ questionCode, body: trimmed }] : [];
  });

export const toSaveProfileRequest = (
  values: WizardValues,
): SaveProfileRequest => ({
  name: values.name,
  tagline: values.tagline?.trim() ? values.tagline : null,
  imageUrl: values.imageUrl,
  chapters: toChapters(values),
  activityInfo: composeActivityInfo(values),
  genres: values.genres,
  links: values.links.map(({ type, url }) => ({ type, url })),
});
