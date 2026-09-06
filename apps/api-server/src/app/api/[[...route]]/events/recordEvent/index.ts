import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import { getCapabilityDeps } from "../../../../../infrastructure/capabilities";
import { recordEvent } from "../../../../../usecases/analyticsEvents/recordEvent";
import { ANALYTICS_EVENT_TYPES } from "../../../../../domain/analyticsEvents/valueObjects/eventType";
import { isBotUserAgent } from "../../../../../utils/botDetection";
import { validateRequest } from "../../validators/validateRequest";
import { handleAppError } from "../../../../../errorMap";
import { createRequestBodyTooLargeError } from "../../errors/requestBodyTooLarge";

const MAX_REQUEST_BODY_SIZE_BYTES = 4 * 1024;

const PROFILE_VIEW_FROM_VALUES: readonly string[] = [
  "announce",
  "share",
  "search",
  "invite",
  "none",
];

const STORY_SCROLL_DEPTH_VALUES: readonly number[] = [25, 50, 75, 100];

const ARTIST_SCOPED_EVENT_TYPES: readonly string[] = [
  "profile_view",
  "story_expand",
  "story_scroll",
  "offer_click",
  "support_click",
  "listening_point_play",
  "notify_subscribe",
  "survey_answer",
];

export const recordEventRequestSchema = z
  .object({
    eventType: z.enum(ANALYTICS_EVENT_TYPES),
    artistId: z.string().uuid().nullable(),
    anonId: z.string().uuid(),
    sessionId: z.string().uuid(),
    path: z.string().min(1).max(2048),
    referrer: z.string().max(2048).nullable(),
    props: z.record(z.string(), z.unknown()),
  })
  .superRefine((body, ctx) => {
    const fail = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

    if (
      ARTIST_SCOPED_EVENT_TYPES.includes(body.eventType) &&
      body.artistId === null
    ) {
      fail(["artistId"], `artistId is required for ${body.eventType}`);
    }

    switch (body.eventType) {
      case "profile_view": {
        const from = body.props.from;
        if (
          typeof from !== "string" ||
          !PROFILE_VIEW_FROM_VALUES.includes(from)
        ) {
          fail(
            ["props", "from"],
            "from must be one of announce/share/search/invite/none",
          );
        }
        break;
      }
      case "story_expand":
      case "notify_subscribe":
        break;
      case "story_scroll": {
        const depth = body.props.depth;
        if (
          typeof depth !== "number" ||
          !STORY_SCROLL_DEPTH_VALUES.includes(depth)
        ) {
          fail(["props", "depth"], "depth must be one of 25/50/75/100");
        }
        break;
      }
      case "offer_click": {
        const position = body.props.position;
        if (position !== "hero" && position !== "after-story") {
          fail(["props", "position"], "position must be hero or after-story");
        }
        break;
      }
      case "support_click": {
        if (
          typeof body.props.platform !== "string" ||
          body.props.platform.length === 0
        ) {
          fail(["props", "platform"], "platform is required");
        }
        if (
          typeof body.props.position !== "string" ||
          body.props.position.length === 0
        ) {
          fail(["props", "position"], "position is required");
        }
        break;
      }
      case "listening_point_play": {
        if (
          typeof body.props.position !== "string" ||
          body.props.position.length === 0
        ) {
          fail(["props", "position"], "position is required");
        }
        break;
      }
      case "survey_answer": {
        const hasBeatboxerAnswer = typeof body.props.isBeatboxer === "boolean";
        const hasQuestionAnswer =
          typeof body.props.questionCode === "string" &&
          body.props.questionCode.length > 0 &&
          typeof body.props.answer === "string" &&
          body.props.answer.length > 0;
        if (!hasBeatboxerAnswer && !hasQuestionAnswer) {
          fail(
            ["props"],
            "requires either isBeatboxer or questionCode + answer",
          );
        }
        break;
      }
      case "invite_open":
      case "invite_signup": {
        if (
          typeof body.props.inviterArtistId !== "string" ||
          body.props.inviterArtistId.length === 0
        ) {
          fail(["props", "inviterArtistId"], "inviterArtistId is required");
        }
        break;
      }
    }
  });

const rejectBotTraffic = createMiddleware(async (c, next) => {
  const userAgent =
    c.req.header("x-forwarded-user-agent") ?? c.req.header("user-agent");
  if (isBotUserAgent(userAgent)) {
    return c.body(null, 204);
  }
  await next();
});

const app = new Hono().post(
  "/",
  bodyLimit({
    maxSize: MAX_REQUEST_BODY_SIZE_BYTES,
    onError: () => {
      throw createRequestBodyTooLargeError();
    },
  }),
  rejectBotTraffic,
  validateRequest("json", recordEventRequestSchema),
  async (c) => {
    const body = c.req.valid("json");
    const caps = getCapabilityDeps().buildPublicWriteCapabilities();

    const result = await recordEvent(caps, body);
    if (!result.ok) {
      return handleAppError(result.error, c);
    }

    return c.body(null, 204);
  },
);

export default app;
