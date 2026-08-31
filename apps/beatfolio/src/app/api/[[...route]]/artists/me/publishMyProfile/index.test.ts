import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../../../../middlewares/requestContext";
import publishMyProfile from "./index";
import { handleBffError } from "../../../../../../errorMap";

const { meGet, publishPost } = vi.hoisted(() => ({
  meGet: vi.fn(),
  publishPost: vi.fn(),
}));

vi.mock("../../../../../../utils/client", () => ({
  createApiServerClient: () => ({
    api: {
      users: { me: { $get: meGet } },
      artists: {
        ":artistId": { profile: { publish: { $post: publishPost } } },
      },
    },
  }),
}));

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", requestContextMiddleware);
  app.route("/", publishMyProfile);
  app.onError(handleBffError);
  return app;
};

const request = (body: unknown) =>
  createApp().request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /artists/me/profile/publish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    meGet.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        registered: true,
        userId: "user-1",
        email: "saku@example.com",
        artist: { artistId: "artist-1", handle: "saku", hasProfile: true },
      }),
    });
    publishPost.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ published: true }),
    });
  });

  it("検証を通った published を自分の artistId 宛てで api-server へ渡す", async () => {
    const res = await request({ published: true });

    expect(publishPost).toHaveBeenCalledWith({
      param: { artistId: "artist-1" },
      json: { published: true },
    });
    expect(res.status).toBe(200);
  });

  it("published が boolean でなければ api-server へ渡さず 400 を返す", async () => {
    const res = await request({ published: "yes" });

    expect(res.status).toBe(400);
    expect(publishPost).not.toHaveBeenCalled();
  });

  it("artist 未登録なら api-server へ渡さず 404 を返す", async () => {
    meGet.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ registered: false }),
    });

    const res = await request({ published: true });

    expect(res.status).toBe(404);
    expect(publishPost).not.toHaveBeenCalled();
  });

  it("api-server のエラーはステータスごと透過する", async () => {
    publishPost.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        error: "Profile not found",
        code: "ArtistProfileNotFoundError",
      }),
    });

    const res = await request({ published: true });

    expect(res.status).toBe(404);
    expect(await res.json()).toStrictEqual({
      error: "Profile not found",
      code: "ArtistProfileNotFoundError",
    });
  });

  it("公開条件を満たさない拒否は不足項目を表示ラベルに解決して返す", async () => {
    publishPost.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        error: "Profile is not publishable: required fields are missing",
        code: "ProfileNotPublishableError",
        details: { missingFields: ["imageUrl", "links"] },
      }),
    });

    const res = await request({ published: true });

    expect(res.status).toBe(422);
    expect(await res.json()).toStrictEqual({
      error: "Profile is not publishable: required fields are missing",
      code: "ProfileNotPublishableError",
      missingRequirements: ["アーティスト写真", "SNS / 配信リンク"],
    });
  });
});
