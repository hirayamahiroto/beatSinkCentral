import type { WizardValues } from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { parseActivityInfo } from "../../../../../../libs/activityInfo";

export type ProfileView = {
  attributes: {
    name: string | null;
    imageUrl: string | null;
    tagline: string | null;
    genres: string[];
    activityInfo: string | null;
  };
  story: {
    chapters: { key: string; body: string }[];
  };
  links: { linkTypeCode: string; url: string }[];
  published: boolean;
};

const toChapterValues = (
  chapters: ProfileView["story"]["chapters"],
): Record<string, string> =>
  Object.fromEntries(chapters.map((chapter) => [chapter.key, chapter.body]));

export const toWizardValues = (profile: ProfileView): Partial<WizardValues> => {
  const { attributes, story } = profile;
  const activity = parseActivityInfo(attributes.activityInfo);
  const links = profile.links.map(({ linkTypeCode, url }) => ({
    type: linkTypeCode,
    url,
  }));

  return {
    ...(attributes.name ? { name: attributes.name } : {}),
    ...(attributes.imageUrl ? { imageUrl: attributes.imageUrl } : {}),
    ...(attributes.tagline ? { tagline: attributes.tagline } : {}),
    ...(attributes.genres.length > 0 ? { genres: attributes.genres } : {}),
    ...(story.chapters.length > 0
      ? { chapters: toChapterValues(story.chapters) }
      : {}),
    ...activity,
    ...(links.length > 0 ? { links } : {}),
  };
};
