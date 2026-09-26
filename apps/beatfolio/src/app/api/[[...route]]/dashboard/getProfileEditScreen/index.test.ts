import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../../../middlewares/requestContext";
import getProfileEdit from "./index";
import { handleBffError } from "../../../../../errorMap";
import {
  createEndpointMock,
  upstreamJsonResponse,
  type ApiServerClient,
  type ApiServerClientMock,
  upstreamErrorResponse,
} from "../../../../../utils/client/testDoubles";

const meGet =
  createEndpointMock<ApiServerClient["api"]["users"]["me"]["$get"]>();
const profileGet =
  createEndpointMock<
    ApiServerClient["api"]["artists"][":artistId"]["profile"]["$get"]
  >();
const linkTypesGet =
  createEndpointMock<ApiServerClient["api"]["link-types"]["$get"]>();
const storyQuestionsGet =
  createEndpointMock<ApiServerClient["api"]["story-questions"]["$get"]>();

const apiServerClient = {
  api: {
    users: { me: { $get: meGet } },
    artists: { ":artistId": { profile: { $get: profileGet } } },
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
  app.route("/", getProfileEdit);
  app.onError(handleBffError);
  return app;
};

const registeredMe = {
  registered: true,
  userId: "user-1",
  email: "saku@example.com",
  artist: { artistId: "artist-1", handle: "saku", hasProfile: true },
};

const linkTypes = [
  { type: "youtube", label: "YouTube" },
  { type: "x", label: "X" },
];

const storyQuestions = [
  { code: "beginning", label: "始まり", required: true },
  { code: "turning_point", label: "転機", required: false },
  { code: "concept", label: "何を表現したいのか", required: false },
];

describe("GET /dashboard/profile/edit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    meGet.mockResolvedValue(upstreamJsonResponse(registeredMe));
    linkTypesGet.mockResolvedValue(upstreamJsonResponse({ linkTypes }));
    storyQuestionsGet.mockResolvedValue(
      upstreamJsonResponse({ storyQuestions }),
    );
  });

  it("email・選択肢・問いマスタ・ウィザード初期値を1つの画面用データにまとめて返す", async () => {
    profileGet.mockResolvedValue(
      upstreamJsonResponse({
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
            chapters: [{ key: "beginning", body: "始めたきっかけ。" }],
          },
          links: [
            { linkTypeCode: "youtube", url: "https://youtube.com/@saku" },
          ],
          presentation: { patternCode: null },
          published: true,
        },
        publishability: { ok: true, missingFields: [] },
        offer: null,
      }),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(200);
    expect(profileGet).toHaveBeenCalledWith({
      param: { artistId: "artist-1" },
    });
    expect(storyQuestionsGet).toHaveBeenCalledTimes(1);
    expect(await res.json()).toStrictEqual({
      registered: true,
      email: "saku@example.com",
      linkTypeOptions: linkTypes,
      storyQuestions,
      defaultValues: {
        name: "SAKU",
        imageUrl: "https://example.com/saku.jpg",
        tagline: "口ひとつで、フロアを揺らす。",
        genres: ["Beatbox"],
        chapters: { beginning: "始めたきっかけ。" },
        location: "東京",
        activityForm: "solo",
        links: [{ type: "youtube", url: "https://youtube.com/@saku" }],
      },
    });
  });

  it("プロフィール未作成でも問いマスタは返し、defaultValues は null で返す", async () => {
    profileGet.mockResolvedValue(
      upstreamJsonResponse({
        handle: "saku",
        profile: null,
        publishability: null,
        offer: null,
      }),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(await res.json()).toStrictEqual({
      registered: true,
      email: "saku@example.com",
      linkTypeOptions: linkTypes,
      storyQuestions,
      defaultValues: null,
    });
  });

  it("未登録なら registered:false だけを返す", async () => {
    meGet.mockResolvedValue(upstreamJsonResponse({ registered: false }));

    const res = await createApp().request("/", { method: "GET" });

    expect(await res.json()).toStrictEqual({ registered: false });
    expect(profileGet).not.toHaveBeenCalled();
  });

  it("登録済みでも artist が無ければ 404 を返す", async () => {
    meGet.mockResolvedValue(
      upstreamJsonResponse({
        registered: true,
        userId: "user-1",
        email: "saku@example.com",
        artist: null,
      }),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(404);
    expect(profileGet).not.toHaveBeenCalled();
  });

  it("いずれかの api-server 呼び出しが失敗したら 502 を返す", async () => {
    profileGet.mockResolvedValue(
      upstreamErrorResponse({ error: "Internal" }, 500),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(502);
  });

  it("問いマスタの取得が失敗したら 502 を返す", async () => {
    storyQuestionsGet.mockResolvedValue(
      upstreamErrorResponse({ error: "Internal" }, 500),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(502);
  });
});
