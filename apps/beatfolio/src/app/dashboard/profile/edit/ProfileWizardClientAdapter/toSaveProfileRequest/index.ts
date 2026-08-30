import type { WizardValues } from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { composeActivityInfo } from "../../../../../../libs/activityInfo";

export type SaveProfileRequest = {
  name: string;
  tagline: string | null;
  imageUrl: string;
  story: string;
  activityInfo: string;
  genres: string[];
  links: { type: string; url: string }[];
};

const joinStory = (values: WizardValues): string =>
  [values.storyOrigin, values.storyTurning, values.storyNow]
    .flatMap((part) => {
      const trimmed = part?.trim();
      return trimmed ? [trimmed] : [];
    })
    .join("\n\n");

export const toSaveProfileRequest = (
  values: WizardValues,
): SaveProfileRequest => ({
  name: values.name,
  tagline: values.tagline?.trim() ? values.tagline : null,
  imageUrl: values.imageUrl,
  story: joinStory(values),
  activityInfo: composeActivityInfo(values),
  genres: values.genres,
  links: values.links.map(({ type, url }) => ({ type, url })),
});
