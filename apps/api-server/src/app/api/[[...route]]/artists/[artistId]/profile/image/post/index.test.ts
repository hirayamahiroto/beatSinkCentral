// @vitest-environment node
// jsdom の FormData/File は Hono の multipart 解析（undici の Request）と互換がなくハングするため node 環境で実行する
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../../../domain/artists/factories";
import { handleAppError } from "../../../../../../../../errorMap";
import { ok } from "../../../../../../../../utils/result";
import uploadProfileImageRoute from "./index";

const actor = {
  user: reconstructUser({
    id: "user-1",
    subId: "auth0|123",
    email: "t@e.com",
  }),
  artist: reconstructArtist({
    artistId: "artist-1",
    accountId: "beatboxer_taro",
    ownerUserId: "user-1",
    profile: null,
  }),
};

const mockUpload = vi.fn();
const mockResolveActorState = vi.fn();

vi.mock("../../../../../../../../middlewares/auth0", () => ({
  requireAuthMiddleware: async (
    _c: unknown,
    next: () => Promise<void>,
  ): Promise<void> => next(),
}));

vi.mock("../../../../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => ({
    resolveActorState: (subId: string) => mockResolveActorState(subId),
    buildArtistStorageWriteCapabilities: (a: unknown) => ({
      actor: a,
      profileImages: { upload: mockUpload },
    }),
  }),
}));

const createApp = (sub: string) => {
  const app = new Hono();
  app.use("*", async (c, next) => {
    c.set("auth0User", { sub });
    await next();
  });
  app.route("/", uploadProfileImageRoute);
  app.onError(handleAppError);
  return app;
};

const request = (artistId: string) => {
  const form = new FormData();
  form.append(
    "file",
    new File([new Uint8Array([1, 2, 3])], "photo.jpg", { type: "image/jpeg" }),
  );
  return createApp("auth0|123").request(`/${artistId}/profile/image`, {
    method: "POST",
    body: form,
  });
};

describe("POST /artists/:artistId/profile/image", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveActorState.mockResolvedValue({ status: "complete", actor });
    mockUpload.mockResolvedValue(
      ok({ publicUrl: "https://example.supabase.co/public/a.jpg" }),
    );
  });

  it("Actor と一致する artistId なら画像をアップロードし imageUrl を返す", async () => {
    const res = await request("artist-1");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.imageUrl).toBe("https://example.supabase.co/public/a.jpg");
    const [{ artistId }] = mockUpload.mock.calls[0];
    expect(artistId).toBe("artist-1");
  });

  it("Actor と一致しない artistId は 404 を返し、アップロードしない", async () => {
    const res = await request("other-artist");

    expect(res.status).toBe(404);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("actor が解決できなければ 404 を返し、アップロードしない", async () => {
    mockResolveActorState.mockResolvedValue({ status: "unregistered" });

    const res = await request("artist-1");

    expect(res.status).toBe(404);
    expect(mockUpload).not.toHaveBeenCalled();
  });
});
