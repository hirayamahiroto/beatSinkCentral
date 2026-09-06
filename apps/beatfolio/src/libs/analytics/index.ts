import type { ProfileViewFrom } from "./profileViewFrom";

type AnalyticsEventEnvelope = {
  artistId: string | null;
};

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
      position: "after-story" | "return-path";
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

const sendWithBeacon = (payload: string): boolean => {
  if (typeof navigator.sendBeacon !== "function") return false;
  const body = new Blob([payload], { type: "application/json" });
  return navigator.sendBeacon(ANALYTICS_ENDPOINT, body);
};

const sendWithKeepaliveFetch = (payload: string): void => {
  void fetch(ANALYTICS_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
};

export const track = (event: AnalyticsEvent): void => {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify(toRequestBody(event));
  if (sendWithBeacon(payload)) return;
  sendWithKeepaliveFetch(payload);
};
