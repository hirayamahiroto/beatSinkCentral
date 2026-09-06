"use client";

import { AudienceArtistProfile } from "@ui/design-system/components/organisms/AudienceArtistProfile";
import { track } from "../../../../libs/analytics";

type Props = Omit<
  React.ComponentProps<typeof AudienceArtistProfile>,
  | "onStoryExpand"
  | "onStoryScroll"
  | "onOfferClick"
  | "onSupportClick"
  | "onNotifySubscribe"
> & {
  artistId: string;
};

export const PlayerDetailClientAdapter = ({ artistId, ...props }: Props) => (
  <AudienceArtistProfile
    {...props}
    onStoryExpand={() => track({ type: "story_expand", artistId })}
    onStoryScroll={(depth) => track({ type: "story_scroll", artistId, depth })}
    onOfferClick={() => {}}
    onSupportClick={() => {}}
    onNotifySubscribe={() => {}}
  />
);
