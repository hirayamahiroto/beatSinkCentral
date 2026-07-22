import type { WizardValues } from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { composeActivityInfo } from "../../../../../../libs/activityInfo";

export type SaveProfileRequest = {
  name: string;
  tagline: string;
  imageUrl: string;
  story: string;
  activityInfo: string;
  genres: string[];
  links: { type: string; url: string }[];
};

const joinStory = (values: WizardValues): string =>
  [values.storyOrigin, values.storyTurning, values.storyNow]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join("\n\n");

export const toSaveProfileRequest = (
  values: WizardValues,
): SaveProfileRequest => ({
  name: values.name,
  tagline: values.tagline,
  imageUrl: values.imageUrl,
  story: joinStory(values),
  activityInfo: composeActivityInfo(values),
  genres: values.genres,
  links: values.links.map(({ type, url }) => ({ type, url })),
});
