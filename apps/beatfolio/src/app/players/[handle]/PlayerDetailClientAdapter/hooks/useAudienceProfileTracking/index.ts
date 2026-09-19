import { useEffect, useRef } from "react";
import { track } from "../../../../../../libs/analytics";
import type { ProfileViewFrom } from "../../../../../../libs/analytics/profileViewFrom";

type TrackableSupportLink = {
  platform: string;
  label: string;
};

type Input = {
  artistId: string;
  profileViewFrom: ProfileViewFrom;
  supportLinks: TrackableSupportLink[];
  hasOffer: boolean;
};

export const useAudienceProfileTracking = ({
  artistId,
  profileViewFrom,
  supportLinks,
  hasOffer,
}: Input) => {
  const viewedKey = useRef<string | null>(null);

  useEffect(() => {
    const key = `${artistId}:${profileViewFrom}`;
    if (viewedKey.current === key) return;
    viewedKey.current = key;
    track({ type: "profile_view", artistId, from: profileViewFrom });
  }, [artistId, profileViewFrom]);

  const platformByLabel = new Map(
    supportLinks.map((link) => [link.label, link.platform]),
  );

  const trackSupportClick = (label: string): void => {
    const platform = platformByLabel.get(label);
    if (platform === undefined) return;
    track({
      type: "support_click",
      artistId,
      platform,
      position: hasOffer ? "return-path" : "after-story",
    });
  };

  return { trackSupportClick };
};
