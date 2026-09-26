import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../../../../middlewares/requestContext";
import saveMyProfile from "./index";
import { handleBffError, throwBffError } from "../../../../../../errorMap";
import { createUpstreamUnavailableError } from "../../../../../../utils/client/errors/upstreamUnavailable";
import {
  createEndpointMock,
  upstreamJsonResponse,
  type ApiServerClient,
  type ApiServerClientMock,
  upstreamErrorResponse,
} from "../../../../../../utils/client/testDoubles";

const meGet =
  createEndpointMock<ApiServerClient["api"]["users"]["me"]["$get"]>();
const attributesPost =
  createEndpointMock<
    ApiServerClient["api"]["artists"][":artistId"]["attributes"]["$post"]
  >();
const chapterPost =
  createEndpointMock<
    ApiServerClient["api"]["artists"][":artistId"]["story"]["chapters"][":chapterKey"]["$post"]
  >();
const linksPost =
  createEndpointMock<
    ApiServerClient["api"]["artists"][":artistId"]["links"]["$post"]
  >();

const apiServerClient = {
  api: {
    users: { me: { $get: meGet } },
    artists: {
      ":artistId": {
        attributes: { $post: attributesPost },
        story: { chapters: { ":chapterKey": { $post: chapterPost } } },
        links: { $post: linksPost },
      },
    },
  },
} satisfies ApiServerClientMock;

vi.mock("../../../../../../utils/client", () => ({
  createApiServerClient: () => apiServerClient,
}));

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", requestContextMiddleware);
  app.route("/", saveMyProfile);
  app.onError(handleBffError);
  return app;
};

const request = (body: unknown) =>
  createApp().request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const fullBody = {
  name: "SAKU",
  tagline: "口ひとつで、フロアを揺らす。",
  activityInfo: "拠点: 東京 / 形態: ソロ",
  genres: ["Beatbox"],
  chapters: [
    { questionCode: "beginning", body: "始めたきっかけ。" },
    { questionCode: "turning_point", body: "" },
  ],
  links: [{ type: "youtube", url: "https://youtube.com/@saku" }],
};

describe("POST /artists/me/profile", () => {
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
    attributesPost.mockResolvedValue(
      upstreamJsonResponse({
        attributes: {
          name: "SAKU",
          imageUrl: null,
          tagline: "口ひとつで、フロアを揺らす。",
          genres: ["Beatbox"],
          activityInfo: "拠点: 東京 / 形態: ソロ",
        },
      }),
    );
    chapterPost.mockResolvedValue(
      upstreamJsonResponse({ story: { chapters: [] } }),
    );
    linksPost.mockResolvedValue(upstreamJsonResponse({ links: [] }));
  });

  it("画面の入力を属性 → 章ごと → リンクの順に構造ごとの更新 API へ振り分け、204 を返す", async () => {
    const res = await request(fullBody);

    expect(res.status).toBe(204);
    expect(attributesPost).toHaveBeenCalledExactlyOnceWith({
      param: { artistId: "artist-1" },
      json: {
        name: "SAKU",
        tagline: "口ひとつで、フロアを揺らす。",
        genres: ["Beatbox"],
        activityInfo: "拠点: 東京 / 形態: ソロ",
      },
    });
    expect(chapterPost.mock.calls).toStrictEqual([
      [
        {
          param: { artistId: "artist-1", chapterKey: "beginning" },
          json: { body: "始めたきっかけ。" },
        },
      ],
      [
        {
          param: { artistId: "artist-1", chapterKey: "turning_point" },
          json: { body: "" },
        },
      ],
    ]);
    expect(linksPost).toHaveBeenCalledExactlyOnceWith({
      param: { artistId: "artist-1" },
      json: {
        links: [{ linkTypeCode: "youtube", url: "https://youtube.com/@saku" }],
      },
    });
    expect(attributesPost.mock.invocationCallOrder[0]).toBeLessThan(
      chapterPost.mock.invocationCallOrder[0],
    );
    expect(chapterPost.mock.invocationCallOrder[1]).toBeLessThan(
      linksPost.mock.invocationCallOrder[0],
    );
  });

  it("artist 未登録なら api-server へ渡さず 404 を返す", async () => {
    meGet.mockResolvedValue(upstreamJsonResponse({ registered: false }));

    const res = await request(fullBody);

    expect(res.status).toBe(404);
    expect(attributesPost).not.toHaveBeenCalled();
    expect(chapterPost).not.toHaveBeenCalled();
    expect(linksPost).not.toHaveBeenCalled();
  });

  it.each([
    ["genres", { ...fullBody, genres: Array(21).fill("Beatbox") }],
    [
      "links",
      {
        ...fullBody,
        links: Array(21).fill({ type: "youtube", url: "https://y.com/@s" }),
      },
    ],
    [
      "chapters",
      {
        ...fullBody,
        chapters: Array(4).fill({ questionCode: "beginning", body: "x" }),
      },
    ],
  ])("%s が上限を超えたら api-server へ渡さず 400 を返す", async (_, body) => {
    const res = await request(body);

    expect(res.status).toBe(400);
    expect(attributesPost).not.toHaveBeenCalled();
  });

  it("構造の配列（genres / chapters / links）が欠けていたら 400 を返す", async () => {
    const res = await request({ name: "SAKU" });

    expect(res.status).toBe(400);
    expect(attributesPost).not.toHaveBeenCalled();
  });

  it("imageUrl は受け取らない（属性の更新に渡さない）", async () => {
    const res = await request({
      ...fullBody,
      imageUrl: "https://example.com/ignored.png",
    });

    expect(res.status).toBe(204);
    expect(attributesPost.mock.calls[0][0].json).not.toHaveProperty("imageUrl");
  });

  it("属性の更新が失敗したら章・リンクは送らず、ステータスごと透過し、保存済みは空で返す", async () => {
    attributesPost.mockResolvedValue(
      upstreamJsonResponse(
        { error: "Invalid name format", code: "InvalidProfileNameFormatError" },
        422,
      ),
    );

    const res = await request(fullBody);

    expect(res.status).toBe(422);
    expect(await res.json()).toStrictEqual({
      error: "Invalid name format",
      code: "InvalidProfileNameFormatError",
      saved: [],
      failedAt: "attributes",
    });
    expect(chapterPost).not.toHaveBeenCalled();
    expect(linksPost).not.toHaveBeenCalled();
  });

  it("章の更新が失敗したら残りの章とリンクは送らず、保存済みの属性と失敗した章を返す", async () => {
    chapterPost.mockResolvedValueOnce(
      upstreamJsonResponse(
        {
          error: "Invalid story chapter format",
          code: "InvalidStoryChapterFormatError",
        },
        422,
      ),
    );

    const res = await request(fullBody);

    expect(res.status).toBe(422);
    expect(await res.json()).toStrictEqual({
      error: "Invalid story chapter format",
      code: "InvalidStoryChapterFormatError",
      saved: ["attributes"],
      failedAt: "chapter:beginning",
    });
    expect(chapterPost).toHaveBeenCalledTimes(1);
    expect(linksPost).not.toHaveBeenCalled();
  });

  it("リンクの更新が 5xx なら 502 に畳み、属性と全章を保存済みとして返す", async () => {
    linksPost.mockResolvedValue(
      upstreamErrorResponse({ error: "Internal Server Error" }, 500),
    );

    const res = await request(fullBody);

    expect(res.status).toBe(502);
    expect(await res.json()).toStrictEqual({
      error: "Upstream request failed",
      code: "UpstreamServerError",
      saved: ["attributes", "chapter:beginning", "chapter:turning_point"],
      failedAt: "links",
    });
  });

  it("途中で api-server に到達できなくなっても、そこまでの保存済みステップを返す", async () => {
    linksPost.mockImplementation(async () =>
      throwBffError(
        createUpstreamUnavailableError(new TypeError("fetch failed")),
      ),
    );

    const res = await request(fullBody);

    expect(res.status).toBe(502);
    expect(await res.json()).toStrictEqual({
      error: "Upstream request failed",
      code: "UpstreamUnavailableError",
      saved: ["attributes", "chapter:beginning", "chapter:turning_point"],
      failedAt: "links",
    });
  });

  it("上流由来でない例外はそのまま投げ、保存進捗で包まない", async () => {
    linksPost.mockRejectedValue(new Error("programming error"));

    const res = await request(fullBody);

    expect(res.status).toBe(500);
    expect(await res.json()).toStrictEqual({ error: "Internal Server Error" });
  });
});
