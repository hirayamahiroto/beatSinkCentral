import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { handleAppError } from "../../errorMap";
import type { SessionProvider } from "../../infrastructure/auth0/sessionProvider";
import { createRequireAuthMiddleware } from "./index";

const getSession = vi.fn<SessionProvider["getSession"]>();

const buildApp = () =>
  new Hono()
    .use(
      "*",
      createRequireAuthMiddleware(() => ({ getSession })),
    )
    .get("/", (c) => {
      const auth0User = c.get("auth0User");
      return c.json({ sub: auth0User.sub });
    })
    .onError(handleAppError);

describe("createRequireAuthMiddleware", () => {
  beforeEach(() => {
    getSession.mockReset();
  });

  it("セッションが無い場合は 401 を返す", async () => {
    getSession.mockResolvedValue(null);

    const res = await buildApp().request("/", { method: "GET" });

    expect(res.status).toBe(401);
    expect(await res.json()).toStrictEqual({ error: "Unauthorized" });
  });

  it("セッションがある場合は context に auth0User を設定して通過する", async () => {
    getSession.mockResolvedValue({ sub: "auth0|abc" });

    const res = await buildApp().request("/", { method: "GET" });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ sub: "auth0|abc" });
  });

  it("リクエストの Cookie を SessionProvider に渡す", async () => {
    getSession.mockResolvedValue({ sub: "auth0|abc" });

    await buildApp().request("/", {
      method: "GET",
      headers: { cookie: "__session=value; other=ignored" },
    });

    expect(getSession).toHaveBeenCalledWith({
      __session: "value",
      other: "ignored",
    });
  });

  it("SessionProvider はリクエストごとに解決される", async () => {
    getSession.mockResolvedValue({ sub: "auth0|abc" });
    const resolveSessionProvider = vi.fn(() => ({ getSession }));
    const app = new Hono()
      .use("*", createRequireAuthMiddleware(resolveSessionProvider))
      .get("/", (c) => c.json({ sub: c.get("auth0User").sub }))
      .onError(handleAppError);

    await app.request("/", { method: "GET" });
    await app.request("/", { method: "GET" });

    expect(resolveSessionProvider).toHaveBeenCalledTimes(2);
  });
});
