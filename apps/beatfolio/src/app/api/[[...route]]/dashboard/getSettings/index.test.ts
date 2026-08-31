import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";
import getSettings from "./index";
import { handleBffError } from "../../../../../errorMap";

const meGet = vi.fn();

const apiClient = { api: { users: { me: { $get: meGet } } } };

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", async (c, next) => {
    c.set("apiClient", apiClient as never);
    await next();
  });
  app.route("/", getSettings);
  app.onError(handleBffError);
  return app;
};

const jsonResponse = (
  body: unknown,
  init: { ok?: boolean; status?: number } = {},
) => ({
  ok: init.ok ?? true,
  status: init.status ?? 200,
  json: async () => body,
});

describe("GET /dashboard/settings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("設定画面が編集する email と handle だけを返す", async () => {
    meGet.mockResolvedValue(
      jsonResponse({
        registered: true,
        userId: "user-1",
        email: "saku@example.com",
        artist: {
          artistId: "artist-1",
          handle: "saku",
          hasProfile: true,
        },
      }),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({
      registered: true,
      email: "saku@example.com",
      handle: "saku",
    });
  });

  it("artist 未作成なら handle は null で返す", async () => {
    meGet.mockResolvedValue(
      jsonResponse({
        registered: true,
        userId: "user-1",
        email: "saku@example.com",
        artist: null,
      }),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(await res.json()).toStrictEqual({
      registered: true,
      email: "saku@example.com",
      handle: null,
    });
  });

  it("未登録なら registered:false だけを返し email を露出しない", async () => {
    meGet.mockResolvedValue(jsonResponse({ registered: false }));

    const res = await createApp().request("/", { method: "GET" });

    expect(await res.json()).toStrictEqual({ registered: false });
  });

  it("api-server が 5xx なら 502 を返す", async () => {
    meGet.mockResolvedValue(
      jsonResponse({ error: "Internal" }, { ok: false, status: 500 }),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(502);
  });

  it("api-server の 4xx はステータスと code を透過する", async () => {
    meGet.mockResolvedValue(
      jsonResponse(
        { error: "Unauthorized", code: "UnauthorizedError" },
        { ok: false, status: 401 },
      ),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(401);
    expect(await res.json()).toStrictEqual({
      error: "Unauthorized",
      code: "UnauthorizedError",
    });
  });
});
