import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../../../../middlewares/requestContext";
import saveMyProfile from "./index";
import { handleBffError } from "../../../../../../errorMap";

const { meGet, attributesPost, chapterPost, linksPost } = vi.hoisted(() => ({
  meGet: vi.fn(),
  attributesPost: vi.fn(),
  chapterPost: vi.fn(),
  linksPost: vi.fn(),
}));

vi.mock("../../../../../../utils/client", () => ({
  createApiServerClient: () => ({
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
  }),
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

const jsonResponse = (
  body: unknown,
  init: { ok?: boolean; status?: number } = {},
) => ({
  ok: init.ok ?? true,
  status: init.status ?? 200,
  json: async () => body,
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
      jsonResponse({
        registered: true,
        userId: "user-1",
        email: "saku@example.com",
        artist: { artistId: "artist-1", handle: "saku", hasProfile: true },
      }),
    );
    attributesPost.mockResolvedValue(jsonResponse({ attributes: {} }));
    chapterPost.mockResolvedValue(jsonResponse({ story: { chapters: [] } }));
    linksPost.mockResolvedValue(jsonResponse({ links: [] }));
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
    meGet.mockResolvedValue(jsonResponse({ registered: false }));

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

  it("属性の更新が失敗したら章・リンクは送らず、ステータスごと透過する", async () => {
    attributesPost.mockResolvedValue(
      jsonResponse(
        { error: "Invalid name format", code: "InvalidProfileNameFormatError" },
        { ok: false, status: 422 },
      ),
    );

    const res = await request(fullBody);

    expect(res.status).toBe(422);
    expect(await res.json()).toStrictEqual({
      error: "Invalid name format",
      code: "InvalidProfileNameFormatError",
    });
    expect(chapterPost).not.toHaveBeenCalled();
    expect(linksPost).not.toHaveBeenCalled();
  });

  it("章の更新が失敗したら残りの章とリンクは送らず、ステータスごと透過する", async () => {
    chapterPost.mockResolvedValueOnce(
      jsonResponse(
        {
          error: "Invalid story chapter format",
          code: "InvalidStoryChapterFormatError",
        },
        { ok: false, status: 422 },
      ),
    );

    const res = await request(fullBody);

    expect(res.status).toBe(422);
    expect(chapterPost).toHaveBeenCalledTimes(1);
    expect(linksPost).not.toHaveBeenCalled();
  });
});
