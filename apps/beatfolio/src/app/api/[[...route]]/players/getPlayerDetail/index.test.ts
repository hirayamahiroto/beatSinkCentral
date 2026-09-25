import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../../../middlewares/requestContext";
import getPlayerDetail from "./index";
import { handleBffError } from "../../../../../errorMap";
import {
  createEndpointMock,
  upstreamJsonResponse,
  type ApiServerClient,
  type ApiServerClientMock,
  type UpstreamSuccessBody,
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
  app.route("/", getPlayerDetail);
  app.onError(handleBffError);
  return app;
};

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
    presentation: { patternCode: null },
    published: true,
  },
} satisfies UpstreamSuccessBody<
  ApiServerClient["api"]["artists"][":handle"]["$get"]
>;

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
    linkTypesGet.mockResolvedValue(upstreamJsonResponse({ linkTypes }));
    storyQuestionsGet.mockResolvedValue(
      upstreamJsonResponse({ storyQuestions }),
    );
  });

  it("handle を api-server へ渡し、§5-2 契約（AudienceArtistProfile props）へ整形して返す（章の問いは問いマスタのラベルへ解決）", async () => {
    profileGet.mockResolvedValue(upstreamJsonResponse(publishedProfile));

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
        {
          platform: "youtube",
          url: "https://youtube.com/@saku",
          label: "YouTube",
        },
        { platform: "other", url: "https://example.com/me", label: "その他" },
      ],
    });
  });

  it("published のみ返す api-server が 404 なら 404 を維持する", async () => {
    profileGet.mockResolvedValue(
      upstreamJsonResponse(
        {
          error: "Artist profile not found",
          code: "ArtistProfileNotFoundError",
        },
        404,
      ),
    );

    const res = await createApp().request("/unknown", { method: "GET" });

    expect(res.status).toBe(404);
  });

  it("書式不正な handle で api-server が 422 なら 404 を返す", async () => {
    profileGet.mockResolvedValue(
      upstreamJsonResponse(
        { error: "Invalid handle format", code: "InvalidHandleFormatError" },
        422,
      ),
    );

    const res = await createApp().request("/not-an-id", { method: "GET" });

    expect(res.status).toBe(404);
  });

  it("api-server が 5xx で失敗したら 502 を返す", async () => {
    profileGet.mockResolvedValue(
      upstreamJsonResponse({ error: "Internal" }, 500),
    );

    const res = await createApp().request("/saku", { method: "GET" });

    expect(res.status).toBe(502);
  });

  it("問いマスタの取得が失敗したら 502 を返す", async () => {
    profileGet.mockResolvedValue(upstreamJsonResponse(publishedProfile));
    storyQuestionsGet.mockResolvedValue(
      upstreamJsonResponse({ error: "Internal" }, 500),
    );

    const res = await createApp().request("/saku", { method: "GET" });

    expect(res.status).toBe(502);
  });
});
