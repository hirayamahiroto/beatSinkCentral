import type { WizardValues } from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { composeActivityInfo } from "../../../../../../libs/activityInfo";

export type SaveProfileRequest = {
  name: string;
  tagline: string | null;
  activityInfo: string;
  genres: string[];
  chapters: { questionCode: string; body: string }[];
  links: { type: string; url: string }[];
};

const toChapters = (
  values: WizardValues,
): { questionCode: string; body: string }[] =>
  Object.entries(values.chapters).map(([questionCode, body]) => ({
    questionCode,
    body: body.trim(),
  }));

export const toSaveProfileRequest = (
  values: WizardValues,
): SaveProfileRequest => ({
  name: values.name,
  tagline: values.tagline?.trim() ? values.tagline : null,
  activityInfo: composeActivityInfo(values),
  genres: values.genres,
  chapters: toChapters(values),
  links: values.links.map(({ type, url }) => ({ type, url })),
});
