import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";
import getPlayerDetail from "./index";
import { handleBffError } from "../../../../../errorMap";

const profileGet = vi.fn();
const linkTypesGet = vi.fn();
const storyQuestionsGet = vi.fn();

const apiClient = {
  api: {
    artists: { ":handle": { $get: profileGet } },
    "link-types": { $get: linkTypesGet },
    "story-questions": { $get: storyQuestionsGet },
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
  handle: "saku",
  artistId: "artist-1",
  profile: {
    attributes: {
      name: "SAKU",
      imageUrl: "https://example.com/saku.jpg",
      tagline: "口ひとつで、フロアを揺らす。",
      genres: ["Beatbox"],
      activityInfo: "拠点: 東京 / 形態: ソロ",
    },
    story: {
      chapters: [
        { key: "beginning", body: "始めたきっかけ。" },
        { key: "concept", body: "表現したいこと。" },
      ],
    },
    links: [
      { linkTypeCode: "youtube", url: "https://youtube.com/@saku" },
      { linkTypeCode: "other", url: "https://example.com/me" },
    ],
    published: true,
  },
};

const linkTypes = [
  { type: "youtube", label: "YouTube" },
  { type: "other", label: "その他" },
];

const storyQuestions = [
  { code: "beginning", label: "始まりの話", required: true },
  { code: "turning_point", label: "転機になったこと", required: false },
  { code: "concept", label: "何を表現したいのか", required: false },
];

describe("GET /players/:handle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    linkTypesGet.mockResolvedValue(jsonResponse({ linkTypes }));
    storyQuestionsGet.mockResolvedValue(jsonResponse({ storyQuestions }));
  });

  it("handle を api-server へ渡し、§5-2 契約（AudienceArtistProfile props）へ整形して返す（章の問いは問いマスタのラベルへ解決）", async () => {
    profileGet.mockResolvedValue(jsonResponse(publishedProfile));

    const res = await createApp().request("/saku", { method: "GET" });

    expect(profileGet).toHaveBeenCalledWith({ param: { handle: "saku" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({
      artistId: "artist-1",
      name: "SAKU",
      tagline: "口ひとつで、フロアを揺らす。",
      imageUrl: "https://example.com/saku.jpg",
      genres: ["Beatbox"],
      storyChapters: [
        { question: "始まりの話", body: "始めたきっかけ。" },
        { question: "何を表現したいのか", body: "表現したいこと。" },
      ],
      translation: null,
      listeningPoint: null,
      offer: null,
      supportLinks: [
        { url: "https://youtube.com/@saku", label: "YouTube" },
        { url: "https://example.com/me", label: "その他" },
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

  it("書式不正な handle で api-server が 422 なら 404 を返す", async () => {
    profileGet.mockResolvedValue(
      jsonResponse(
        { error: "Invalid handle format" },
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

  it("問いマスタの取得が失敗したら 502 を返す", async () => {
    profileGet.mockResolvedValue(jsonResponse(publishedProfile));
    storyQuestionsGet.mockResolvedValue(
      jsonResponse({ error: "Internal" }, { ok: false, status: 500 }),
    );

    const res = await createApp().request("/saku", { method: "GET" });

    expect(res.status).toBe(502);
  });
});
