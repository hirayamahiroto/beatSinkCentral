import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../../../middlewares/requestContext";
import listPlayers from "./index";
import { createUpstreamUnavailableError } from "../../../../../utils/client/errors/upstreamUnavailable";
import { handleBffError, throwBffError } from "../../../../../errorMap";
import {
  createEndpointMock,
  upstreamJsonResponse,
  upstreamMalformedJsonResponse,
  type ApiServerClient,
  type ApiServerClientMock,
  upstreamErrorResponse,
} from "../../../../../utils/client/testDoubles";

const artistsGet =
  createEndpointMock<ApiServerClient["api"]["artists"]["$get"]>();

const apiServerClient = {
  api: {
    artists: { $get: artistsGet },
  },
} satisfies ApiServerClientMock;

vi.mock("../../../../../utils/client", () => ({
  createApiServerClient: () => apiServerClient,
}));

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", requestContextMiddleware);
  app.route("/", listPlayers);
  app.onError(handleBffError);
  return app;
};

describe("GET /players", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("api-server の公開プロフィール一覧を players として返す", async () => {
    artistsGet.mockResolvedValue(
      upstreamJsonResponse({
        profiles: [
          {
            handle: "saku",
            name: "SAKU",
            imageUrl: "https://example.com/saku.jpg",
            tagline: "口ひとつで、フロアを揺らす。",
            genres: ["Beatbox"],
          },
          {
            handle: "rei",
            name: "REI",
            imageUrl: null,
            tagline: null,
            genres: [],
          },
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
          tagline: "口ひとつで、フロアを揺らす。",
          genres: ["Beatbox"],
        },
        {
          handle: "rei",
          name: "REI",
          imageUrl: null,
          tagline: null,
          genres: [],
        },
      ],
    });
  });

  it("公開プロフィールが無いときは空配列を返す", async () => {
    artistsGet.mockResolvedValue(upstreamJsonResponse({ profiles: [] }));

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ players: [] });
  });

  it("api-server が失敗したら 502 を返す", async () => {
    artistsGet.mockResolvedValue(
      upstreamErrorResponse({ error: "Internal" }, 500),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(502);
  });

  it("api-server への接続自体が失敗したら 502 を返す", async () => {
    artistsGet.mockImplementation(async () =>
      throwBffError(
        createUpstreamUnavailableError(new TypeError("fetch failed")),
      ),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(502);
    expect(await res.json()).toStrictEqual({
      error: "Upstream request failed",
      code: "UpstreamUnavailableError",
    });
  });

  it("応答の解析に失敗したら 502 を返す", async () => {
    artistsGet.mockResolvedValue(upstreamMalformedJsonResponse());

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(502);
    expect(await res.json()).toStrictEqual({
      error: "Upstream response violated contract",
      code: "UpstreamContractViolationError",
    });
  });
});
