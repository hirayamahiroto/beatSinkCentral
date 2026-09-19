import { Hono } from "hono";
import { z } from "zod";
import { getCookie, setCookie } from "hono/cookie";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";
import { validateRequest } from "../../validators/validateRequest";
import { toUpstreamError } from "../../shared/toUpstreamError";
import { resolveVisitorIds } from "../../shared/resolveVisitorIds";

const ANALYTICS_EVENT_TYPES = [
  "profile_view",
  "story_expand",
  "story_scroll",
  "offer_click",
  "support_click",
  "listening_point_play",
  "notify_subscribe",
  "survey_answer",
  "invite_open",
  "invite_signup",
] as const;

export const trackEventRequestSchema = z.object({
  eventType: z.enum(ANALYTICS_EVENT_TYPES),
  artistId: z.string().uuid().nullable(),
  path: z.string().min(1).max(2048),
  referrer: z.string().max(2048).nullable(),
  props: z.record(z.string(), z.unknown()),
});

const ANON_ID_COOKIE = "anon_id";
const SESSION_ID_COOKIE = "session_id";
const ANON_ID_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const SESSION_ID_MAX_AGE_SECONDS = 60 * 30;

const app = new Hono<RequestContextEnv>().post(
  "/",
  validateRequest("json", trackEventRequestSchema),
  async (c) => {
    const apiClient = c.get("apiClient");
    const body = c.req.valid("json");

    const { anonId, sessionId } = resolveVisitorIds({
      anonId: getCookie(c, ANON_ID_COOKIE),
      sessionId: getCookie(c, SESSION_ID_COOKIE),
    });

    setCookie(c, ANON_ID_COOKIE, anonId, {
      maxAge: ANON_ID_MAX_AGE_SECONDS,
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
    });
    setCookie(c, SESSION_ID_COOKIE, sessionId, {
      maxAge: SESSION_ID_MAX_AGE_SECONDS,
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
    });

    const res = await apiClient.api.events.$post({
      json: { ...body, anonId, sessionId },
    });
    if (!res.ok) throw await toUpstreamError(res);

    return c.body(null, 204);
  },
);

export default app;
