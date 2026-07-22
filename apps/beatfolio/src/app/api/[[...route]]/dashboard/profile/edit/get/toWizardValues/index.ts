import type { WizardValues } from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { parseActivityInfo } from "../../../../../../../../libs/activityInfo";

export type ProfileView = {
  name: string | null;
  tagline: string | null;
  imageUrl: string | null;
  story: string | null;
  activityInfo: string | null;
  genres: string[];
  links: { type: string; url: string; label: string | null }[];
  published: boolean;
};

export const toWizardValues = (profile: ProfileView): Partial<WizardValues> => {
  const activity = parseActivityInfo(profile.activityInfo);
  const links = profile.links.map(({ type, url }) => ({ type, url }));

  return {
    ...(profile.name ? { name: profile.name } : {}),
    ...(profile.imageUrl ? { imageUrl: profile.imageUrl } : {}),
    ...(profile.tagline ? { tagline: profile.tagline } : {}),
    ...(profile.genres.length > 0 ? { genres: profile.genres } : {}),
    ...(profile.story ? { storyOrigin: profile.story } : {}),
    ...activity,
    ...(links.length > 0 ? { links } : {}),
    published: profile.published,
  };
};
