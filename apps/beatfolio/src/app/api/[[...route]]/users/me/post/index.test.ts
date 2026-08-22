import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../../../../middlewares/requestContext";
import updateMyEmail from "./index";

const { meGet, emailPost } = vi.hoisted(() => ({
  meGet: vi.fn(),
  emailPost: vi.fn(),
}));

vi.mock("../../../../../../utils/client", () => ({
  createApiServerClient: () => ({
    api: {
      users: {
        me: { $get: meGet },
        ":userId": { $post: emailPost },
      },
    },
  }),
}));

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", requestContextMiddleware);
  app.route("/", updateMyEmail);
  return app;
};

const request = (body: unknown) =>
  createApp().request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /users/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    meGet.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        registered: true,
        userId: "user-1",
        email: "saku@example.com",
        artist: null,
      }),
    });
    emailPost.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ userId: "user-1", email: "new@example.com" }),
    });
  });

  it("検証を通った email を自分の userId 宛てで api-server へ渡す", async () => {
    const res = await request({ email: "new@example.com" });

    expect(emailPost).toHaveBeenCalledWith({
      param: { userId: "user-1" },
      json: { email: "new@example.com" },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({
      userId: "user-1",
      email: "new@example.com",
    });
  });

  it("email が空なら api-server へ渡さず 400 を返す", async () => {
    const res = await request({ email: "" });

    expect(res.status).toBe(400);
    expect(emailPost).not.toHaveBeenCalled();
  });

  it("user 未登録なら api-server へ渡さず 404 を返す", async () => {
    meGet.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ registered: false }),
    });

    const res = await request({ email: "new@example.com" });

    expect(res.status).toBe(404);
    expect(emailPost).not.toHaveBeenCalled();
  });

  it("api-server のエラーはステータスごと透過する", async () => {
    emailPost.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "Email already taken" }),
    });

    const res = await request({ email: "taken@example.com" });

    expect(res.status).toBe(409);
    expect(await res.json()).toStrictEqual({ error: "Email already taken" });
  });
});
