import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../../middlewares/requestContext";
import updateMyAccountId from "./index";

const meGet = vi.fn();
const accountIdPost = vi.fn();

const apiClient = {
  api: {
    users: { me: { $get: meGet } },
    artists: { ":artistId": { $post: accountIdPost } },
  },
};

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", async (c, next) => {
    c.set("apiClient", apiClient as never);
    await next();
  });
  app.route("/", updateMyAccountId);
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
        artist: { artistId: "artist-1", accountId: "saku", hasProfile: true },
      }),
    });
    accountIdPost.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ artistId: "artist-1", accountId: "saku_new" }),
    });
  });

  it("検証を通った accountId を自分の artistId 宛てで api-server へ渡す", async () => {
    const res = await request({ accountId: "saku_new" });

    expect(accountIdPost).toHaveBeenCalledWith({
      param: { artistId: "artist-1" },
      json: { accountId: "saku_new" },
    });
    expect(res.status).toBe(200);
  });

  it("accountId が空なら api-server へ渡さず 400 を返す", async () => {
    const res = await request({ accountId: "" });

    expect(res.status).toBe(400);
    expect(accountIdPost).not.toHaveBeenCalled();
  });

  it("artist 未登録なら api-server へ渡さず 404 を返す", async () => {
    meGet.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ registered: false }),
    });

    const res = await request({ accountId: "saku_new" });

    expect(res.status).toBe(404);
    expect(accountIdPost).not.toHaveBeenCalled();
  });

  it("api-server のエラーはステータスごと透過する", async () => {
    accountIdPost.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "accountId already taken" }),
    });

    const res = await request({ accountId: "saku_new" });

    expect(res.status).toBe(409);
    expect(await res.json()).toStrictEqual({
      error: "accountId already taken",
    });
  });
});
