import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../../../middlewares/requestContext";
import getProfileEdit from "./index";
import { handleBffError } from "../../../../../errorMap";

const { meGet, profileGet, linkTypesGet } = vi.hoisted(() => ({
  meGet: vi.fn(),
  profileGet: vi.fn(),
  linkTypesGet: vi.fn(),
}));

vi.mock("../../../../../utils/client", () => ({
  createApiServerClient: () => ({
    api: {
      users: { me: { $get: meGet } },
      artists: { ":artistId": { profile: { $get: profileGet } } },
      "link-types": { $get: linkTypesGet },
    },
  }),
}));

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", requestContextMiddleware);
  app.route("/", getProfileEdit);
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
    meGet.mockResolvedValue(jsonResponse(registeredMe));
    linkTypesGet.mockResolvedValue(jsonResponse({ linkTypes }));
  });

  it("email・選択肢・問いマスタ・ウィザード初期値を1つの画面用データにまとめて返す", async () => {
    profileGet.mockResolvedValue(
      jsonResponse({
        profile: {
          name: "SAKU",
          tagline: "口ひとつで、フロアを揺らす。",
          imageUrl: "https://example.com/saku.jpg",
          chapters: [{ questionCode: "beginning", body: "始めたきっかけ。" }],
          activityInfo: "拠点: 東京 / 形態: ソロ",
          genres: ["Beatbox"],
          links: [
            { type: "youtube", url: "https://youtube.com/@saku", label: null },
          ],
          published: true,
        },
        missingPublishFields: [],
        storyQuestions,
      }),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(200);
    expect(profileGet).toHaveBeenCalledWith({
      param: { artistId: "artist-1" },
    });
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
      jsonResponse({
        profile: null,
        missingPublishFields: null,
        storyQuestions,
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
    meGet.mockResolvedValue(jsonResponse({ registered: false }));
    profileGet.mockResolvedValue(
      jsonResponse({
        profile: null,
        missingPublishFields: null,
        storyQuestions,
      }),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(await res.json()).toStrictEqual({ registered: false });
  });

  it("登録済みでも artist が無ければ 404 を返す", async () => {
    meGet.mockResolvedValue(
      jsonResponse({
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
      jsonResponse({ error: "Internal" }, { ok: false, status: 500 }),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(502);
  });
});
