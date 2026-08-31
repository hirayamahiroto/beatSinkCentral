// @vitest-environment node
// jsdom の FormData/File は Hono の multipart 解析（undici の Request）と互換がなくハングするため node 環境で実行する
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../../../../middlewares/requestContext";
import uploadProfileImage from "./index";
import { handleBffError } from "../../../../../../errorMap";

const { meGet, imagePost } = vi.hoisted(() => ({
  meGet: vi.fn(),
  imagePost: vi.fn(),
}));

vi.mock("../../../../../../utils/client", () => ({
  createApiServerClient: () => ({
    api: {
      users: { me: { $get: meGet } },
      artists: { ":artistId": { profile: { image: { $post: imagePost } } } },
    },
  }),
}));

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", requestContextMiddleware);
  app.route("/", uploadProfileImage);
  app.onError(handleBffError);
  return app;
};

const request = (file: File | string) => {
  const form = new FormData();
  form.append("file", file);
  return createApp().request("/", { method: "POST", body: form });
};

const imageFile = () =>
  new File([new Uint8Array([1, 2, 3])], "photo.jpg", { type: "image/jpeg" });

describe("POST /artists/me/profile/image", () => {
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
    imagePost.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        imageUrl: "https://example.supabase.co/public/a.jpg",
      }),
    });
  });

  it("検証を通ったファイルを自分の artistId 宛てで api-server へ渡す", async () => {
    const res = await request(imageFile());

    expect(imagePost).toHaveBeenCalledTimes(1);
    const [{ param, form }] = imagePost.mock.calls[0];
    expect(param).toStrictEqual({ artistId: "artist-1" });
    expect(form.file).toBeInstanceOf(File);
    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({
      imageUrl: "https://example.supabase.co/public/a.jpg",
    });
  });

  it("file がファイルでなければ api-server へ渡さず 400 を返す", async () => {
    const res = await request("not-a-file");

    expect(res.status).toBe(400);
    expect(imagePost).not.toHaveBeenCalled();
  });

  it("artist 未登録なら api-server へ渡さず 404 を返す", async () => {
    meGet.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ registered: false }),
    });

    const res = await request(imageFile());

    expect(res.status).toBe(404);
    expect(imagePost).not.toHaveBeenCalled();
  });

  it("api-server のエラーはステータスごと透過する", async () => {
    imagePost.mockResolvedValue({
      ok: false,
      status: 413,
      json: async () => ({
        error: "Image file is too large",
        code: "ImageTooLargeError",
      }),
    });

    const res = await request(imageFile());

    expect(res.status).toBe(413);
    expect(await res.json()).toStrictEqual({
      error: "Image file is too large",
      code: "ImageTooLargeError",
    });
  });
});
