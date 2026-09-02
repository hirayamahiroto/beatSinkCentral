import type { WizardValues } from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { parseActivityInfo } from "../../../../../../libs/activityInfo";

export type ProfileView = {
  name: string | null;
  tagline: string | null;
  imageUrl: string | null;
  chapters: { questionCode: string; body: string }[];
  activityInfo: string | null;
  genres: string[];
  links: { type: string; url: string; label: string | null }[];
  published: boolean;
};

const toChapterValues = (
  chapters: ProfileView["chapters"],
): Record<string, string> =>
  Object.fromEntries(
    chapters.map((chapter) => [chapter.questionCode, chapter.body]),
  );

export const toWizardValues = (profile: ProfileView): Partial<WizardValues> => {
  const activity = parseActivityInfo(profile.activityInfo);
  const links = profile.links.map(({ type, url }) => ({ type, url }));

  return {
    ...(profile.name ? { name: profile.name } : {}),
    ...(profile.imageUrl ? { imageUrl: profile.imageUrl } : {}),
    ...(profile.tagline ? { tagline: profile.tagline } : {}),
    ...(profile.genres.length > 0 ? { genres: profile.genres } : {}),
    ...(profile.chapters.length > 0
      ? { chapters: toChapterValues(profile.chapters) }
      : {}),
    ...activity,
    ...(links.length > 0 ? { links } : {}),
  };
};
