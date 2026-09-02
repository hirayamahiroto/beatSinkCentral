type AnalyticsEventEnvelope = {
  artistId: string | null;
};

type ProfileViewFrom = "announce" | "share" | "search" | "invite" | "none";

export type AnalyticsEvent =
  | (AnalyticsEventEnvelope & { type: "profile_view"; from: ProfileViewFrom })
  | (AnalyticsEventEnvelope & { type: "story_expand" })
  | (AnalyticsEventEnvelope & {
      type: "story_scroll";
      depth: 25 | 50 | 75 | 100;
    })
  | (AnalyticsEventEnvelope & {
      type: "offer_click";
      position: "hero" | "after-story";
    })
  | (AnalyticsEventEnvelope & {
      type: "support_click";
      platform: string;
      position: string;
    })
  | (AnalyticsEventEnvelope & {
      type: "listening_point_play";
      position: string;
    })
  | (AnalyticsEventEnvelope & { type: "notify_subscribe" })
  | (AnalyticsEventEnvelope & { type: "survey_answer"; isBeatboxer: boolean })
  | (AnalyticsEventEnvelope & {
      type: "survey_answer";
      questionCode: string;
      answer: string;
    })
  | (AnalyticsEventEnvelope & { type: "invite_open"; inviterArtistId: string })
  | (AnalyticsEventEnvelope & {
      type: "invite_signup";
      inviterArtistId: string;
    });

const ANALYTICS_ENDPOINT = "/api/events";

const toRequestBody = (event: AnalyticsEvent): Record<string, unknown> => {
  const { type, artistId, ...props } = event;
  return {
    eventType: type,
    artistId,
    path: window.location.pathname,
    referrer: document.referrer || null,
    props,
  };
};

export const track = (event: AnalyticsEvent): void => {
  if (typeof navigator === "undefined" || !navigator.sendBeacon) return;

  const body = new Blob([JSON.stringify(toRequestBody(event))], {
    type: "application/json",
  });
  navigator.sendBeacon(ANALYTICS_ENDPOINT, body);
};
