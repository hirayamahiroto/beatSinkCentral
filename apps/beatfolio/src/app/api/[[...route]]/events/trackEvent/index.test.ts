import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../../../middlewares/requestContext";
import trackEvent from "./index";
import { handleBffError } from "../../../../../errorMap";

const { eventsPost } = vi.hoisted(() => ({
  eventsPost: vi.fn(),
}));

vi.mock("../../../../../utils/client", () => ({
  createApiServerClient: () => ({
    api: { events: { $post: eventsPost } },
  }),
}));

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", requestContextMiddleware);
  app.route("/", trackEvent);
  app.onError(handleBffError);
  return app;
};

const validBody = {
  eventType: "profile_view",
  artistId: "11111111-1111-1111-1111-111111111111",
  path: "/players/handle",
  referrer: null,
  props: { from: "announce" },
};

const request = (body: unknown, headers: Record<string, string> = {}) =>
  createApp().request("/", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

describe("POST /events (BFF trackEvent)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventsPost.mockResolvedValue({ ok: true, status: 204 });
  });

  it("検証を通った内容にanonId/sessionIdを補って204を返す", async () => {
    const res = await request(validBody);

    expect(res.status).toBe(204);
    expect(eventsPost).toHaveBeenCalledTimes(1);
    const [{ json }] = eventsPost.mock.calls[0];
    expect(json.eventType).toBe("profile_view");
    expect(json.artistId).toBe(validBody.artistId);
    expect(json.props).toEqual({ from: "announce" });
    expect(typeof json.anonId).toBe("string");
    expect(typeof json.sessionId).toBe("string");
  });

  it("anon_id/session_id Cookieが無ければ新規発行してSet-Cookieする", async () => {
    const res = await request(validBody);

    const setCookie = res.headers.getSetCookie();
    expect(setCookie.some((c) => c.startsWith("anon_id="))).toBe(true);
    expect(setCookie.some((c) => c.startsWith("session_id="))).toBe(true);
  });

  it("既存のanon_id/session_id Cookieを引き継ぐ", async () => {
    await request(validBody, {
      cookie: "anon_id=anon-existing; session_id=session-existing",
    });

    const [{ json }] = eventsPost.mock.calls[0];
    expect(json.anonId).toBe("anon-existing");
    expect(json.sessionId).toBe("session-existing");
  });

  it("未知のevent_typeは400を返し、api-serverへ渡さない", async () => {
    const res = await request({ ...validBody, eventType: "unknown_event" });

    expect(res.status).toBe(400);
    expect(eventsPost).not.toHaveBeenCalled();
  });

  it("api-serverのエラーはステータスごと透過する", async () => {
    eventsPost.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: "Invalid request",
        code: "InvalidRequestFormatError",
      }),
    });

    const res = await request(validBody);

    expect(res.status).toBe(400);
    expect(await res.json()).toStrictEqual({
      error: "Invalid request",
      code: "InvalidRequestFormatError",
    });
  });
});
