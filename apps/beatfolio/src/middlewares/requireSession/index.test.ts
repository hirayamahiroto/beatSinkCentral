import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { NextRequest } from "next/server";
import { requireSessionMiddleware } from "./index";

const getSessionFromRequestMock =
  vi.fn<(req: NextRequest) => Promise<{ user: { sub: string } } | null>>();

vi.mock("../../libs/auth0", () => ({
  getSessionFromRequest: (req: NextRequest) => getSessionFromRequestMock(req),
}));

const createApp = () =>
  new Hono().use("*", requireSessionMiddleware).get("*", (c) => c.text("ok"));

describe("requireSessionMiddleware", () => {
  beforeEach(() => vi.clearAllMocks());

  it("セッションが無ければ同一オリジンの /auth/login へ redirect する", async () => {
    getSessionFromRequestMock.mockResolvedValue(null);

    const res = await createApp().request("http://localhost/dashboard");

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/auth/login");
  });

  it("セッションがあれば後続のハンドラへ通す", async () => {
    getSessionFromRequestMock.mockResolvedValue({ user: { sub: "auth0|1" } });

    const res = await createApp().request("http://localhost/dashboard");

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
  });
});
