import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { handleAppError } from "../../errorMap";

const getSessionMock = vi.fn();

vi.mock("../../infrastructure/auth0", () => ({
  auth0: {
    getSession: () => getSessionMock(),
  },
}));

const buildApp = async () => {
  const { requireAuthMiddleware } = await import("./index");
  return new Hono()
    .use("*", requireAuthMiddleware)
    .get("/", (c) => {
      const auth0User = c.get("auth0User");
      return c.json({ sub: auth0User.sub });
    })
    .onError(handleAppError);
};

describe("requireAuthMiddleware", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
  });

  it("セッションが無い場合は 401 を返す", async () => {
    getSessionMock.mockResolvedValue(null);
    const app = await buildApp();

    const res = await app.request("/", { method: "GET" });

    expect(res.status).toBe(401);
    expect(await res.json()).toStrictEqual({ error: "Unauthorized" });
  });

  it("session.user が無い場合は 401 を返す", async () => {
    getSessionMock.mockResolvedValue({});
    const app = await buildApp();

    const res = await app.request("/", { method: "GET" });

    expect(res.status).toBe(401);
    expect(await res.json()).toStrictEqual({ error: "Unauthorized" });
  });

  it("session.user がある場合は context に auth0User を設定して通過する", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "auth0|abc" } });
    const app = await buildApp();

    const res = await app.request("/", { method: "GET" });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ sub: "auth0|abc" });
  });
});
