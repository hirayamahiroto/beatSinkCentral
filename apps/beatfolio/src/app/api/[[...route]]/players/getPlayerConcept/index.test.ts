import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../../../middlewares/requestContext";
import getPlayerConcept from "./index";
import { handleBffError } from "../../../../../errorMap";
import {
  createEndpointMock,
  upstreamJsonResponse,
  type ApiServerClient,
  type ApiServerClientMock,
  type UpstreamSuccessBody,
  upstreamErrorResponse,
} from "../../../../../utils/client/testDoubles";

const profileGet =
  createEndpointMock<ApiServerClient["api"]["artists"][":handle"]["$get"]>();
const linkTypesGet =
  createEndpointMock<ApiServerClient["api"]["link-types"]["$get"]>();
const storyQuestionsGet =
  createEndpointMock<ApiServerClient["api"]["story-questions"]["$get"]>();

const apiServerClient = {
  api: {
    artists: { ":handle": { $get: profileGet } },
    "link-types": { $get: linkTypesGet },
    "story-questions": { $get: storyQuestionsGet },
  },
} satisfies ApiServerClientMock;

vi.mock("../../../../../utils/client", () => ({
  createApiServerClient: () => apiServerClient,
}));

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", requestContextMiddleware);
  app.route("/", getPlayerConcept);
  app.onError(handleBffError);
  return app;
};

const publishedProfile = {
  handle: "saku",
  artistId: "0d7fbb2e-5f6c-4d3a-9c1e-2b8f4a6d7e90",
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
} satisfies UpstreamSuccessBody<
  ApiServerClient["api"]["artists"][":handle"]["$get"]
>;

describe("GET /players/:handle/concept", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    linkTypesGet.mockResolvedValue(
      upstreamJsonResponse({
        linkTypes: [{ type: "youtube", label: "YouTube" }],
      }),
    );
    storyQuestionsGet.mockResolvedValue(
      upstreamJsonResponse({
        storyQuestions: [
          { code: "beginning", label: "始まり", required: true },
          { code: "turning_point", label: "転機", required: false },
          { code: "concept", label: "何を表現したいのか", required: true },
        ],
      }),
    );
  });

  it("選んだ表現パターンと、章ラベル・リンクラベルを解決した没入ページ用データを返す", async () => {
    profileGet.mockResolvedValue(upstreamJsonResponse(publishedProfile));

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
      upstreamJsonResponse({
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
      upstreamJsonResponse({
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
      upstreamJsonResponse(
        {
          error: "Artist profile not found",
          code: "ArtistProfileNotFoundError",
        },
        404,
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
      upstreamErrorResponse({ error: "Internal" }, 500),
    );

    const res = await createApp().request("/saku/concept");

    expect(res.status).toBe(502);
  });
});
