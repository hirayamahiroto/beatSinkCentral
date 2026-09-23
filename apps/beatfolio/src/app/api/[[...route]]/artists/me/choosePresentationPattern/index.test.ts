import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../../../../middlewares/requestContext";
import choosePresentationPattern from "./index";
import { handleBffError } from "../../../../../../errorMap";
import {
  createEndpointMock,
  upstreamJsonResponse,
  type ApiServerClient,
  type ApiServerClientMock,
} from "../../../../../../utils/client/testDoubles";

const meGet =
  createEndpointMock<ApiServerClient["api"]["users"]["me"]["$get"]>();
const presentationPost =
  createEndpointMock<
    ApiServerClient["api"]["artists"][":artistId"]["presentation"]["$post"]
  >();

const apiServerClient = {
  api: {
    users: { me: { $get: meGet } },
    artists: { ":artistId": { presentation: { $post: presentationPost } } },
  },
} satisfies ApiServerClientMock;

vi.mock("../../../../../../utils/client", () => ({
  createApiServerClient: () => apiServerClient,
}));

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", requestContextMiddleware);
  app.route("/", choosePresentationPattern);
  app.onError(handleBffError);
  return app;
};

const request = (body: unknown) =>
  createApp().request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /artists/me/presentation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    meGet.mockResolvedValue(
      upstreamJsonResponse({
        registered: true,
        userId: "user-1",
        email: "saku@example.com",
        artist: { artistId: "artist-1", handle: "saku", hasProfile: true },
      }),
    );
    presentationPost.mockResolvedValue(
      upstreamJsonResponse({ presentation: { patternCode: "editorial" } }),
    );
  });

  it("自分の artistId を解決して表現パターンを api-server へ送り、応答を透過する", async () => {
    const res = await request({ patternCode: "editorial" });

    expect(res.status).toBe(200);
    expect(presentationPost).toHaveBeenCalledExactlyOnceWith({
      param: { artistId: "artist-1" },
      json: { patternCode: "editorial" },
    });
    expect(await res.json()).toStrictEqual({
      presentation: { patternCode: "editorial" },
    });
  });

  it("patternCode が無ければ api-server へ送らず 400 を返す", async () => {
    const res = await request({});

    expect(res.status).toBe(400);
    expect(presentationPost).not.toHaveBeenCalled();
  });

  it("api-server の 422 はステータスとボディを透過する", async () => {
    presentationPost.mockResolvedValue(
      upstreamJsonResponse(
        {
          error: "Invalid presentation pattern",
          code: "InvalidPresentationPatternError",
        },
        422,
      ),
    );

    const res = await request({ patternCode: "carousel" });

    expect(res.status).toBe(422);
    expect(await res.json()).toStrictEqual({
      error: "Invalid presentation pattern",
      code: "InvalidPresentationPatternError",
    });
  });

  it("artist 未登録なら 404 を返す", async () => {
    meGet.mockResolvedValue(upstreamJsonResponse({ registered: false }));

    const res = await request({ patternCode: "editorial" });

    expect(res.status).toBe(404);
    expect(presentationPost).not.toHaveBeenCalled();
  });
});
