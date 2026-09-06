import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../../../../middlewares/requestContext";
import saveMyOffer from "./index";
import { handleBffError } from "../../../../../../errorMap";

const { meGet, offersPost } = vi.hoisted(() => ({
  meGet: vi.fn(),
  offersPost: vi.fn(),
}));

vi.mock("../../../../../../utils/client", () => ({
  createApiServerClient: () => ({
    api: {
      users: { me: { $get: meGet } },
      artists: { ":artistId": { offers: { $post: offersPost } } },
    },
  }),
}));

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", requestContextMiddleware);
  app.route("/", saveMyOffer);
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

const offerInput = {
  date: "2026-09-20",
  place: "渋谷 WWW",
  ticketUrl: "https://tickets.example.com/e/1",
  comment: "新曲をやります",
  coPerformers: [
    { name: "Hana", handle: "hana_bb" },
    { name: "Ken", handle: null },
  ],
};

const offerView = {
  ...offerInput,
};

describe("POST /artists/me/offer", () => {
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
    offersPost.mockResolvedValue(jsonResponse({ offer: offerView }));
  });

  it("自分の artistId を解決してオファーを api-server へ送り、応答を透過する", async () => {
    const res = await request(offerInput);

    expect(res.status).toBe(200);
    expect(offersPost).toHaveBeenCalledExactlyOnceWith({
      param: { artistId: "artist-1" },
      json: {
        date: "2026-09-20",
        place: "渋谷 WWW",
        ticketUrl: "https://tickets.example.com/e/1",
        comment: "新曲をやります",
        coPerformers: [
          { name: "Hana", handle: "hana_bb" },
          { name: "Ken", handle: null },
        ],
      },
    });
    expect(await res.json()).toStrictEqual({ offer: offerView });
  });

  it("必須項目が欠けていれば api-server へ送らず 400 を返す", async () => {
    const res = await request({ ...offerInput, ticketUrl: "" });

    expect(res.status).toBe(400);
    expect(offersPost).not.toHaveBeenCalled();
  });

  it("api-server の 422 はステータスとボディを透過する", async () => {
    offersPost.mockResolvedValue(
      jsonResponse(
        {
          error: "Co-performer not found: hana_bb",
          code: "CoPerformerNotFoundError",
        },
        { ok: false, status: 422 },
      ),
    );

    const res = await request(offerInput);

    expect(res.status).toBe(422);
    expect(await res.json()).toStrictEqual({
      error: "Co-performer not found: hana_bb",
      code: "CoPerformerNotFoundError",
    });
  });

  it("artist 未登録なら 404 を返す", async () => {
    meGet.mockResolvedValue(jsonResponse({ registered: false }));

    const res = await request(offerInput);

    expect(res.status).toBe(404);
    expect(offersPost).not.toHaveBeenCalled();
  });
});
