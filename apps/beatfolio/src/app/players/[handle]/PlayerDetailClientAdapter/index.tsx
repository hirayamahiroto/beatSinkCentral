"use client";

import {
  AudienceArtistProfile,
  getVisibleAudienceStoryChapters,
} from "@ui/design-system/components/organisms/AudienceArtistProfile";
import { track } from "../../../../libs/analytics";
import type { ProfileViewFrom } from "../../../../libs/analytics/profileViewFrom";
import { useStoryExpansion } from "./hooks/useStoryExpansion";
import { useNotifySubscription } from "./hooks/useNotifySubscription";
import { useStoryScrollTracking } from "./hooks/useStoryScrollTracking";
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
  | "storyExpanded"
  | "onExpandStory"
  | "onChapterEndRef"
  | "onOfferClick"
  | "onSupportClick"
  | "email"
  | "onEmailChange"
  | "subscribed"
  | "onSubmitSubscription"
  | "supportLinks"
> & {
  artistId: string;
  profileViewFrom: ProfileViewFrom;
  supportLinks: TrackableSupportLink[];
};

export const PlayerDetailClientAdapter = ({
  artistId,
  profileViewFrom,
  storyChapters,
  ...props
}: Props) => {
  const { expanded: storyExpanded, expand: expandStory } = useStoryExpansion({
    onExpand: () => track({ type: "story_expand", artistId }),
  });

  const visibleChapterCount = getVisibleAudienceStoryChapters(
    storyChapters,
    storyExpanded,
  ).length;

  const { registerChapterEndElement } = useStoryScrollTracking({
    chapterCount: storyChapters.length,
    visibleChapterCount,
    onDepthReached: (depth) => track({ type: "story_scroll", artistId, depth }),
  });

  const {
    email,
    setEmail,
    subscribed,
    submit: submitSubscription,
  } = useNotifySubscription({ onSubscribe: () => {} });

  const { trackSupportClick } = useAudienceProfileTracking({
    artistId,
    profileViewFrom,
    supportLinks: props.supportLinks,
    hasOffer: props.offer !== null,
  });

  return (
    <AudienceArtistProfile
      {...props}
      storyChapters={storyChapters}
      storyExpanded={storyExpanded}
      onExpandStory={expandStory}
      onChapterEndRef={registerChapterEndElement}
      onOfferClick={() => {}}
      onSupportClick={trackSupportClick}
      email={email}
      onEmailChange={setEmail}
      subscribed={subscribed}
      onSubmitSubscription={submitSubscription}
    />
  );
};
