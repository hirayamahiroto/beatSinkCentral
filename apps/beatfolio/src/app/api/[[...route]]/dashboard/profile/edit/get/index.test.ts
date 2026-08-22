import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../../../../../middlewares/requestContext";
import getProfileEdit from "./index";

const { meGet, profileGet, linkTypesGet } = vi.hoisted(() => ({
  meGet: vi.fn(),
  profileGet: vi.fn(),
  linkTypesGet: vi.fn(),
}));

vi.mock("../../../../../../../utils/client", () => ({
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
  artist: { artistId: "artist-1", accountId: "saku", hasProfile: true },
};

const linkTypes = [
  { type: "youtube", label: "YouTube" },
  { type: "x", label: "X" },
];

describe("GET /dashboard/profile/edit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    meGet.mockResolvedValue(jsonResponse(registeredMe));
    linkTypesGet.mockResolvedValue(jsonResponse({ linkTypes }));
  });

  it("email・選択肢・ウィザード初期値を1つの画面用データにまとめて返す", async () => {
    profileGet.mockResolvedValue(
      jsonResponse({
        profile: {
          name: "SAKU",
          tagline: "口ひとつで、フロアを揺らす。",
          imageUrl: "https://example.com/saku.jpg",
          story: "始めたきっかけ。",
          activityInfo: "拠点: 東京 / 形態: ソロ",
          genres: ["Beatbox"],
          links: [
            { type: "youtube", url: "https://youtube.com/@saku", label: null },
          ],
          published: true,
        },
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
      defaultValues: {
        name: "SAKU",
        imageUrl: "https://example.com/saku.jpg",
        tagline: "口ひとつで、フロアを揺らす。",
        genres: ["Beatbox"],
        storyOrigin: "始めたきっかけ。",
        location: "東京",
        activityForm: "solo",
        links: [{ type: "youtube", url: "https://youtube.com/@saku" }],
        published: true,
      },
    });
  });

  it("プロフィール未作成なら defaultValues は null で返す", async () => {
    profileGet.mockResolvedValue(jsonResponse({ profile: null }));

    const res = await createApp().request("/", { method: "GET" });

    expect(await res.json()).toStrictEqual({
      registered: true,
      email: "saku@example.com",
      linkTypeOptions: linkTypes,
      defaultValues: null,
    });
  });

  it("未登録なら registered:false だけを返す", async () => {
    meGet.mockResolvedValue(jsonResponse({ registered: false }));
    profileGet.mockResolvedValue(jsonResponse({ profile: null }));

    const res = await createApp().request("/", { method: "GET" });

    expect(await res.json()).toStrictEqual({ registered: false });
  });

  it("登録済みでも artist が無ければ 502 を返す", async () => {
    meGet.mockResolvedValue(
      jsonResponse({
        registered: true,
        userId: "user-1",
        email: "saku@example.com",
        artist: null,
      }),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(502);
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
