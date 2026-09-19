import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";
import getPlayerConcept from "./index";
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
  app.route("/", getPlayerConcept);
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
    links: [{ linkTypeCode: "youtube", url: "https://youtube.com/@saku" }],
    presentation: { patternCode: "spotlight" },
    published: true,
  },
};

describe("GET /players/:handle/concept", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    linkTypesGet.mockResolvedValue(
      jsonResponse({ linkTypes: [{ type: "youtube", label: "YouTube" }] }),
    );
    storyQuestionsGet.mockResolvedValue(
      jsonResponse({
        storyQuestions: [
          { code: "beginning", label: "始まり" },
          { code: "turning_point", label: "転機" },
          { code: "concept", label: "何を表現したいのか" },
        ],
      }),
    );
  });

  it("選んだ表現パターンと、章ラベル・リンクラベルを解決した没入ページ用データを返す", async () => {
    profileGet.mockResolvedValue(jsonResponse(publishedProfile));

    const res = await createApp().request("/saku/concept");

    expect(profileGet).toHaveBeenCalledWith({ param: { handle: "saku" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({
      patternCode: "spotlight",
      name: "SAKU",
      tagline: "口ひとつで、フロアを揺らす。",
      heroImageUrl: "https://example.com/saku.jpg",
      genres: ["Beatbox"],
      activityInfo: "拠点: 東京 / 形態: ソロ",
      chapters: [
        { key: "beginning", label: "始まり", body: "始めたきっかけ。" },
        {
          key: "concept",
          label: "何を表現したいのか",
          body: "表現したいこと。",
        },
      ],
      links: [
        { type: "youtube", url: "https://youtube.com/@saku", label: "YouTube" },
      ],
      primaryAction: null,
    });
  });

  it("表現パターン未選択なら interview を既定にする", async () => {
    profileGet.mockResolvedValue(
      jsonResponse({
        ...publishedProfile,
        profile: {
          ...publishedProfile.profile,
          presentation: { patternCode: null },
        },
      }),
    );

    const res = await createApp().request("/saku/concept");

    expect((await res.json()).patternCode).toBe("interview");
  });

  it("UI 未実装の表現パターンは契約違反として 502 を返す", async () => {
    profileGet.mockResolvedValue(
      jsonResponse({
        ...publishedProfile,
        profile: {
          ...publishedProfile.profile,
          presentation: { patternCode: "carousel" },
        },
      }),
    );

    const res = await createApp().request("/saku/concept");

    expect(res.status).toBe(502);
    expect(await res.json()).toStrictEqual({
      error: "Upstream response violated contract",
      code: "UpstreamContractViolationError",
    });
  });

  it("未公開・不在の handle は 404 を返す", async () => {
    profileGet.mockResolvedValue(
      jsonResponse(
        {
          error: "Artist profile not found",
          code: "ArtistProfileNotFoundError",
        },
        { ok: false, status: 404 },
      ),
    );

    const res = await createApp().request("/nobody/concept");

    expect(res.status).toBe(404);
    expect(await res.json()).toStrictEqual({
      error: "Player profile not found",
      code: "PlayerNotFoundError",
    });
  });

  it("api-server が 5xx なら 502 を返す", async () => {
    profileGet.mockResolvedValue(
      jsonResponse({ error: "Internal" }, { ok: false, status: 500 }),
    );

    const res = await createApp().request("/saku/concept");

    expect(res.status).toBe(502);
  });
});
