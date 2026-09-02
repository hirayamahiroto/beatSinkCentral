"use client";

import { AudienceArtistProfile } from "@ui/design-system/components/organisms/AudienceArtistProfile";

type Props = Omit<
  React.ComponentProps<typeof AudienceArtistProfile>,
  "onStoryExpand" | "onOfferClick" | "onSupportClick" | "onNotifySubscribe"
>;

export const PlayerDetailClientAdapter = (props: Props) => (
  <AudienceArtistProfile
    {...props}
    onStoryExpand={() => {}}
    onOfferClick={() => {}}
    onSupportClick={() => {}}
    onNotifySubscribe={() => {}}
  />
);
