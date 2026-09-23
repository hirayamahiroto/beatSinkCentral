import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../../../middlewares/requestContext";
import getOnboarding from "./index";
import { handleBffError } from "../../../../../errorMap";
import {
  createEndpointMock,
  upstreamJsonResponse,
  type ApiServerClient,
  type ApiServerClientMock,
} from "../../../../../utils/client/testDoubles";

const meGet =
  createEndpointMock<ApiServerClient["api"]["users"]["me"]["$get"]>();

const apiServerClient = {
  api: { users: { me: { $get: meGet } } },
} satisfies ApiServerClientMock;

vi.mock("../../../../../utils/client", () => ({
  createApiServerClient: () => apiServerClient,
}));

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", requestContextMiddleware);
  app.route("/", getOnboarding);
  app.onError(handleBffError);
  return app;
};

describe("GET /onboarding", () => {
  beforeEach(() => vi.clearAllMocks());

  it("登録済みかどうかだけを返し、ユーザー情報を露出しない", async () => {
    meGet.mockResolvedValue(
      upstreamJsonResponse({
        registered: true,
        userId: "user-1",
        email: "saku@example.com",
        artist: null,
      }),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ registered: true });
  });

  it("未登録なら registered:false を返す", async () => {
    meGet.mockResolvedValue(upstreamJsonResponse({ registered: false }));

    const res = await createApp().request("/", { method: "GET" });

    expect(await res.json()).toStrictEqual({ registered: false });
  });

  it("api-server が 5xx なら 502 を返す", async () => {
    meGet.mockResolvedValue(upstreamJsonResponse({ error: "Internal" }, 500));

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(502);
  });

  it("api-server の 4xx はステータスと code を透過する", async () => {
    meGet.mockResolvedValue(
      upstreamJsonResponse(
        { error: "Unauthorized", code: "UnauthorizedError" },
        401,
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
