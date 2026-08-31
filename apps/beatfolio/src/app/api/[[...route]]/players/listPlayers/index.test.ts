import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";
import listPlayers from "./index";
import { createUpstreamUnavailableError } from "../../../../../utils/client/errors/upstreamUnavailable";
import { handleBffError } from "../../../../../errorMap";

const artistsGet = vi.fn();

const apiClient = {
  api: {
    artists: { $get: artistsGet },
  },
};

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", async (c, next) => {
    c.set("apiClient", apiClient as never);
    await next();
  });
  app.route("/", listPlayers);
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

describe("GET /players", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("api-server の公開プロフィール一覧を players として返す", async () => {
    artistsGet.mockResolvedValue(
      jsonResponse({
        profiles: [
          {
            handle: "saku",
            name: "SAKU",
            imageUrl: "https://example.com/saku.jpg",
          },
          { handle: "rei", name: "REI", imageUrl: null },
        ],
      }),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({
      players: [
        {
          handle: "saku",
          name: "SAKU",
          imageUrl: "https://example.com/saku.jpg",
        },
        { handle: "rei", name: "REI", imageUrl: null },
      ],
    });
  });

  it("公開プロフィールが無いときは空配列を返す", async () => {
    artistsGet.mockResolvedValue(jsonResponse({ profiles: [] }));

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ players: [] });
  });

  it("api-server が失敗したら 502 を返す", async () => {
    artistsGet.mockResolvedValue(
      jsonResponse({ error: "Internal" }, { ok: false, status: 500 }),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(502);
  });

  it("api-server への接続自体が失敗したら 502 を返す", async () => {
    artistsGet.mockRejectedValue(
      createUpstreamUnavailableError(new TypeError("fetch failed")),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(502);
    expect(await res.json()).toStrictEqual({
      error: "Upstream request failed",
      code: "UpstreamUnavailableError",
    });
  });

  it("応答の解析に失敗したら 502 を返す", async () => {
    artistsGet.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected end of JSON input");
      },
    });

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(502);
    expect(await res.json()).toStrictEqual({
      error: "Upstream response violated contract",
      code: "UpstreamContractViolationError",
    });
  });
});
