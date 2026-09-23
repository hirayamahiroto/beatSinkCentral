import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { NextResponse } from "next/server";
import type { handleAuthRequest } from "../../libs/auth0";
import { requireAuthMiddleware, type AuthEnv } from "./index";

const handleAuthRequestMock = vi.fn<typeof handleAuthRequest>();

vi.mock("../../libs/auth0", () => ({
  handleAuthRequest: (req: Request) => handleAuthRequestMock(req),
}));

const passThrough = () => {
  const res = new NextResponse(null, { status: 200 });
  res.headers.set("set-cookie", "appSession=rolled; Path=/");
  return res;
};

const createApp = () =>
  new Hono<AuthEnv>().use("*", requireAuthMiddleware).get("*", (c) =>
    c.json({
      rolledCookie: c.get("authResponse").headers.get("set-cookie"),
    }),
  );

describe("requireAuthMiddleware", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Auth0 が 200 で通した非 auth パスは、その応答を authResponse に載せて後続へ通す", async () => {
    handleAuthRequestMock.mockResolvedValue(passThrough());

    const res = await createApp().request("http://localhost/dashboard");

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({
      rolledCookie: "appSession=rolled; Path=/",
    });
  });

  it("Auth0 が 200 以外を返したらその応答をそのまま返し、後続へ進まない", async () => {
    handleAuthRequestMock.mockResolvedValue(
      NextResponse.redirect("https://tenant.auth0.com/authorize", 302),
    );

    const res = await createApp().request("http://localhost/dashboard");

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "https://tenant.auth0.com/authorize",
    );
  });

  it("/auth/ 配下は Auth0 の応答が 200 でもそのまま返し、後続へ進まない", async () => {
    handleAuthRequestMock.mockResolvedValue(
      new NextResponse("auth handled", { status: 200 }),
    );

    const res = await createApp().request("http://localhost/auth/callback");

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("auth handled");
  });
});
