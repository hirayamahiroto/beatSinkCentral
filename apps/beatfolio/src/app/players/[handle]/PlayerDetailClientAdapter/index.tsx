"use client";

import { AudienceArtistProfile } from "@ui/design-system/components/organisms/AudienceArtistProfile";
import type { ProfileViewFrom } from "../../../../libs/analytics/profileViewFrom";
import { useAudienceProfileTracking } from "./hooks/useAudienceProfileTracking";

type AudienceArtistProfileProps = React.ComponentProps<
  typeof AudienceArtistProfile
>;

type TrackableSupportLink =
  AudienceArtistProfileProps["supportLinks"][number] & {
    platform: string;
  };

type Props = Omit<
  AudienceArtistProfileProps,
  | "supportLinks"
  | "onStoryExpand"
  | "onOfferClick"
  | "onSupportClick"
  | "onNotifySubscribe"
> & {
  artistId: string;
  profileViewFrom: ProfileViewFrom;
  supportLinks: TrackableSupportLink[];
};

export const PlayerDetailClientAdapter = ({
  artistId,
  profileViewFrom,
  ...props
}: Props) => {
  const { trackSupportClick } = useAudienceProfileTracking({
    artistId,
    profileViewFrom,
    supportLinks: props.supportLinks,
    hasOffer: props.offer !== null,
  });

  return (
    <AudienceArtistProfile
      {...props}
      onStoryExpand={() => {}}
      onOfferClick={() => {}}
      onSupportClick={trackSupportClick}
      onNotifySubscribe={() => {}}
    />
  );
};
