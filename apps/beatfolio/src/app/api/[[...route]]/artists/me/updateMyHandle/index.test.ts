import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../../../../middlewares/requestContext";
import updateMyHandle from "./index";
import { handleBffError } from "../../../../../../errorMap";

const { meGet, handlePost } = vi.hoisted(() => ({
  meGet: vi.fn(),
  handlePost: vi.fn(),
}));

vi.mock("../../../../../../utils/client", () => ({
  createApiServerClient: () => ({
    api: {
      users: { me: { $get: meGet } },
      artists: { ":artistId": { $post: handlePost } },
    },
  }),
}));

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", requestContextMiddleware);
  app.route("/", updateMyHandle);
  app.onError(handleBffError);
  return app;
};

const request = (body: unknown) =>
  createApp().request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /artists/me", () => {
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
    handlePost.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ artistId: "artist-1", handle: "saku_new" }),
    });
  });

  it("検証を通った handle を自分の artistId 宛てで api-server へ渡す", async () => {
    const res = await request({ handle: "saku_new" });

    expect(handlePost).toHaveBeenCalledWith({
      param: { artistId: "artist-1" },
      json: { handle: "saku_new" },
    });
    expect(res.status).toBe(200);
  });

  it("handle が空なら api-server へ渡さず 400 を返す", async () => {
    const res = await request({ handle: "" });

    expect(res.status).toBe(400);
    expect(handlePost).not.toHaveBeenCalled();
  });

  it("artist 未登録なら api-server へ渡さず 404 を返す", async () => {
    meGet.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ registered: false }),
    });

    const res = await request({ handle: "saku_new" });

    expect(res.status).toBe(404);
    expect(handlePost).not.toHaveBeenCalled();
  });

  it("api-server のエラーはステータスごと透過する", async () => {
    handlePost.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error: "handle already taken",
        code: "HandleAlreadyTakenError",
      }),
    });

    const res = await request({ handle: "saku_new" });

    expect(res.status).toBe(409);
    expect(await res.json()).toStrictEqual({
      error: "handle already taken",
      code: "HandleAlreadyTakenError",
    });
  });

  it("code の無い 4xx は契約違反として 502 にする", async () => {
    handlePost.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "handle already taken" }),
    });

    const res = await request({ handle: "saku_new" });

    expect(res.status).toBe(502);
    expect(await res.json()).toStrictEqual({
      error: "Upstream response violated contract",
      code: "UpstreamContractViolationError",
    });
  });
});
