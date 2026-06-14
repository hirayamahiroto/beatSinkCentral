import type { WizardValues } from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { parseActivityInfo } from "../activityInfo";

export type ProfileView = {
  name: string | null;
  tagline: string | null;
  imageUrl: string | null;
  story: string | null;
  activityInfo: string | null;
  genres: string[];
  snsLinks: string[];
  published: boolean;
};

type SnsPlatform = WizardValues["snsLinks"][number]["platform"];

const inferPlatform = (url: string): SnsPlatform => {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "other";
  }

  if (host.endsWith("youtube.com") || host === "youtu.be") return "youtube";
  if (
    host === "x.com" ||
    host.endsWith(".x.com") ||
    host.endsWith("twitter.com")
  )
    return "x";
  if (host.endsWith("instagram.com")) return "instagram";
  if (host.endsWith("tiktok.com")) return "tiktok";
  return "other";
};

export const toWizardValues = (profile: ProfileView): Partial<WizardValues> => {
  const activity = parseActivityInfo(profile.activityInfo);
  const snsLinks = profile.snsLinks.map((url) => ({
    platform: inferPlatform(url),
    url,
  }));

  return {
    ...(profile.name ? { name: profile.name } : {}),
    ...(profile.imageUrl ? { imageUrl: profile.imageUrl } : {}),
    ...(profile.tagline ? { tagline: profile.tagline } : {}),
    ...(profile.genres.length > 0 ? { genres: profile.genres } : {}),
    ...(profile.story ? { storyOrigin: profile.story } : {}),
    ...activity,
    ...(snsLinks.length > 0 ? { snsLinks } : {}),
    published: profile.published,
  };
};
