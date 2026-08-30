import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";
import getPlayerDetail from "./index";
import { handleBffError } from "../../../../../errorMap";

const profileGet = vi.fn();
const linkTypesGet = vi.fn();

const apiClient = {
  api: {
    artists: { ":accountId": { $get: profileGet } },
    "link-types": { $get: linkTypesGet },
  },
};

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", async (c, next) => {
    c.set("apiClient", apiClient as never);
    await next();
  });
  app.route("/", getPlayerDetail);
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

const publishedProfile = {
  profile: {
    name: "SAKU",
    tagline: "口ひとつで、フロアを揺らす。",
    imageUrl: "https://example.com/saku.jpg",
    story: "始めたきっかけ。",
    activityInfo: "拠点: 東京 / 形態: ソロ",
    genres: ["Beatbox"],
    links: [
      { type: "youtube", url: "https://youtube.com/@saku", label: null },
      { type: "other", url: "https://example.com/me", label: "個人HP" },
    ],
    published: true,
  },
};

const linkTypes = [
  { type: "youtube", label: "YouTube" },
  { type: "other", label: "その他" },
];

describe("GET /players/:accountId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    linkTypesGet.mockResolvedValue(jsonResponse({ linkTypes }));
  });

  it("accountId を api-server へ渡し、リンクのラベルを解決して返す", async () => {
    profileGet.mockResolvedValue(jsonResponse(publishedProfile));

    const res = await createApp().request("/saku", { method: "GET" });

    expect(profileGet).toHaveBeenCalledWith({ param: { accountId: "saku" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({
      name: "SAKU",
      tagline: "口ひとつで、フロアを揺らす。",
      imageUrl: "https://example.com/saku.jpg",
      story: "始めたきっかけ。",
      activityInfo: "拠点: 東京 / 形態: ソロ",
      genres: ["Beatbox"],
      links: [
        { url: "https://youtube.com/@saku", label: "YouTube" },
        { url: "https://example.com/me", label: "個人HP" },
      ],
    });
  });

  it("published のみ返す api-server が 404 なら 404 を維持する", async () => {
    profileGet.mockResolvedValue(
      jsonResponse({ error: "Not found" }, { ok: false, status: 404 }),
    );

    const res = await createApp().request("/unknown", { method: "GET" });

    expect(res.status).toBe(404);
  });

  it("書式不正な accountId で api-server が 422 なら 404 を返す", async () => {
    profileGet.mockResolvedValue(
      jsonResponse(
        { error: "Invalid accountId format" },
        { ok: false, status: 422 },
      ),
    );

    const res = await createApp().request("/not-an-id", { method: "GET" });

    expect(res.status).toBe(404);
  });

  it("api-server が 5xx で失敗したら 502 を返す", async () => {
    profileGet.mockResolvedValue(
      jsonResponse({ error: "Internal" }, { ok: false, status: 500 }),
    );

    const res = await createApp().request("/saku", { method: "GET" });

    expect(res.status).toBe(502);
  });
});
