import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { handleAppError } from "../../../../../errorMap";
import recordEventRoute from "./index";

const mockRecord = vi.fn();

vi.mock("../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => ({
    buildPublicWriteCapabilities: () => ({
      analyticsEvents: { record: mockRecord },
    }),
  }),
}));

const createApp = () => {
  const app = new Hono();
  app.route("/", recordEventRoute);
  app.onError(handleAppError);
  return app;
};

const validProfileViewBody = {
  eventType: "profile_view",
  artistId: "11111111-1111-1111-1111-111111111111",
  anonId: "22222222-2222-2222-2222-222222222222",
  sessionId: "33333333-3333-3333-3333-333333333333",
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

describe("POST /events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecord.mockResolvedValue(undefined);
  });

  it("有効なpayloadは204を返し、イベントをrecordする", async () => {
    const res = await request(validProfileViewBody);

    expect(res.status).toBe(204);
    expect(mockRecord).toHaveBeenCalledTimes(1);
    expect(mockRecord).toHaveBeenCalledWith({
      id: expect.any(String),
      eventType: "profile_view",
      artistId: validProfileViewBody.artistId,
      anonId: validProfileViewBody.anonId,
      sessionId: validProfileViewBody.sessionId,
      path: validProfileViewBody.path,
      referrer: null,
      from: "announce",
      props: null,
      occurredAt: expect.any(Date),
    });
  });

  it("未知のevent_typeは400を返し、DBに到達しない", async () => {
    const res = await request({
      ...validProfileViewBody,
      eventType: "unknown_event",
    });

    expect(res.status).toBe(400);
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("propsの型が不一致なら400を返し、DBに到達しない", async () => {
    const res = await request({
      ...validProfileViewBody,
      eventType: "story_scroll",
      props: { depth: "50" },
    });

    expect(res.status).toBe(400);
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("artist_idが必要なイベントでnullなら400を返し、DBに到達しない", async () => {
    const res = await request({
      ...validProfileViewBody,
      artistId: null,
    });

    expect(res.status).toBe(400);
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("bot User-Agentからの送信は204を返すが、recordを呼ばない", async () => {
    const res = await request(validProfileViewBody, {
      "user-agent":
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    });

    expect(res.status).toBe(204);
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("x-forwarded-user-agentがbotパターンならrecordを呼ばない", async () => {
    const res = await request(validProfileViewBody, {
      "x-forwarded-user-agent": "facebookexternalhit/1.1",
      "user-agent": "node-fetch",
    });

    expect(res.status).toBe(204);
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("通常のUser-Agentは記録される", async () => {
    const res = await request(validProfileViewBody, {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
    });

    expect(res.status).toBe(204);
    expect(mockRecord).toHaveBeenCalledTimes(1);
  });

  it("リクエストボディが大きすぎる場合は413を返す", async () => {
    const res = await request({
      ...validProfileViewBody,
      props: { from: "announce", padding: "x".repeat(10_000) },
    });

    expect(res.status).toBe(413);
    expect(mockRecord).not.toHaveBeenCalled();
  });
});
