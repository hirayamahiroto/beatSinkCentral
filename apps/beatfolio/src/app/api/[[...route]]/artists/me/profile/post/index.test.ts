import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../../../../../middlewares/requestContext";
import saveMyProfile from "./index";

const { meGet, profilePost } = vi.hoisted(() => ({
  meGet: vi.fn(),
  profilePost: vi.fn(),
}));

vi.mock("../../../../../../../utils/client", () => ({
  createApiServerClient: () => ({
    api: {
      users: { me: { $get: meGet } },
      artists: { ":artistId": { profile: { $post: profilePost } } },
    },
  }),
}));

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", requestContextMiddleware);
  app.route("/", saveMyProfile);
  return app;
};

const request = (body: unknown) =>
  createApp().request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /artists/me/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    meGet.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        registered: true,
        userId: "user-1",
        email: "saku@example.com",
        artist: { artistId: "artist-1", accountId: "saku", hasProfile: true },
      }),
    });
    profilePost.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ accountId: "saku", profile: { name: "SAKU" } }),
    });
  });

  it("検証を通ったボディを自分の artistId 宛てで api-server へ渡す", async () => {
    const body = { name: "SAKU", genres: ["Beatbox"] };

    const res = await request(body);

    expect(profilePost).toHaveBeenCalledWith({
      param: { artistId: "artist-1" },
      json: body,
    });
    expect(res.status).toBe(200);
  });

  it("artist 未登録なら api-server へ渡さず 404 を返す", async () => {
    meGet.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ registered: false }),
    });

    const res = await request({ name: "SAKU" });

    expect(res.status).toBe(404);
    expect(profilePost).not.toHaveBeenCalled();
  });

  it("genres が上限を超えたら api-server へ渡さず 400 を返す", async () => {
    const res = await request({ genres: Array(21).fill("Beatbox") });

    expect(res.status).toBe(400);
    expect(profilePost).not.toHaveBeenCalled();
  });

  it("links が上限を超えたら api-server へ渡さず 400 を返す", async () => {
    const res = await request({
      links: Array(21).fill({ type: "youtube", url: "https://youtube.com/@s" }),
    });

    expect(res.status).toBe(400);
    expect(profilePost).not.toHaveBeenCalled();
  });

  it("上限ちょうどの genres / links は api-server へ渡す", async () => {
    const res = await request({
      genres: Array(20).fill("Beatbox"),
      links: Array(20).fill({ type: "youtube", url: "https://youtube.com/@s" }),
    });

    expect(res.status).toBe(200);
    expect(profilePost).toHaveBeenCalledTimes(1);
  });

  it("api-server のエラーはステータスごと透過する", async () => {
    profilePost.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: "Invalid imageUrl format" }),
    });

    const res = await request({ imageUrl: "not-a-url" });

    expect(res.status).toBe(422);
    expect(await res.json()).toStrictEqual({
      error: "Invalid imageUrl format",
    });
  });
});
