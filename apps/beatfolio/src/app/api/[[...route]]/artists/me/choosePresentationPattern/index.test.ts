import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../../../../middlewares/requestContext";
import choosePresentationPattern from "./index";
import { handleBffError } from "../../../../../../errorMap";

const { meGet, presentationPost } = vi.hoisted(() => ({
  meGet: vi.fn(),
  presentationPost: vi.fn(),
}));

vi.mock("../../../../../../utils/client", () => ({
  createApiServerClient: () => ({
    api: {
      users: { me: { $get: meGet } },
      artists: { ":artistId": { presentation: { $post: presentationPost } } },
    },
  }),
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

const jsonResponse = (
  body: unknown,
  init: { ok?: boolean; status?: number } = {},
) => ({
  ok: init.ok ?? true,
  status: init.status ?? 200,
  json: async () => body,
});

describe("POST /artists/me/presentation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    meGet.mockResolvedValue(
      jsonResponse({
        registered: true,
        userId: "user-1",
        email: "saku@example.com",
        artist: { artistId: "artist-1", handle: "saku", hasProfile: true },
      }),
    );
    presentationPost.mockResolvedValue(
      jsonResponse({ presentation: { patternCode: "editorial" } }),
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
      jsonResponse(
        {
          error: "Invalid presentation pattern",
          code: "InvalidPresentationPatternError",
        },
        { ok: false, status: 422 },
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
    meGet.mockResolvedValue(jsonResponse({ registered: false }));

    const res = await request({ patternCode: "editorial" });

    expect(res.status).toBe(404);
    expect(presentationPost).not.toHaveBeenCalled();
  });
});
