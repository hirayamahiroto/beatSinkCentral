// @vitest-environment node
// jsdom の FormData/File は Hono の multipart 解析（undici の Request）と互換がなくハングするため node 環境で実行する
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../../../../middlewares/requestContext";
import uploadProfileImage from "./index";

const imagePost = vi.fn();

const apiClient = {
  api: {
    artists: {
      ":artistId": { profile: { image: { $post: imagePost } } },
    },
  },
};

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", async (c, next) => {
    c.set("apiClient", apiClient as never);
    await next();
  });
  app.route("/", uploadProfileImage);
  return app;
};

const request = (artistId: string, file: File | string) => {
  const form = new FormData();
  form.append("file", file);
  return createApp().request(`/${artistId}/profile/image`, {
    method: "POST",
    body: form,
  });
};

const imageFile = () =>
  new File([new Uint8Array([1, 2, 3])], "photo.jpg", { type: "image/jpeg" });

describe("POST /artists/:artistId/profile/image", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    imagePost.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        imageUrl: "https://example.supabase.co/public/a.jpg",
      }),
    });
  });

  it("検証を通ったファイルを param と form のまま api-server へ渡す", async () => {
    const res = await request("artist-1", imageFile());

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
    const res = await request("artist-1", "not-a-file");

    expect(res.status).toBe(400);
    expect(imagePost).not.toHaveBeenCalled();
  });

  it("api-server のエラーはステータスごと透過する", async () => {
    imagePost.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: "Artist not found" }),
    });

    const res = await request("other-artist", imageFile());

    expect(res.status).toBe(404);
    expect(await res.json()).toStrictEqual({ error: "Artist not found" });
  });
});
