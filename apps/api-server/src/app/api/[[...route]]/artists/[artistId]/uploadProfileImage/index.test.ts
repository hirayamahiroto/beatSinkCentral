// @vitest-environment node
// jsdom の FormData/File は Hono の multipart 解析（undici の Request）と互換がなくハングするため node 環境で実行する
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../../../../domain/artistProfiles/factories";
import type { ArtistProfilePersistenceData } from "../../../../../../domain/artistProfiles/entities";
import { handleAppError } from "../../../../../../errorMap";
import { ok, err } from "../../../../../../utils/result";
import { createProfileImageUploadFailedError } from "../../../../../../domain/artistProfiles/errors/profileImageUploadFailed";
import uploadProfileImageRoute from "./index";

const actor = {
  user: reconstructUser({
    id: "user-1",
    subId: "auth0|123",
    email: "t@e.com",
  }),
  artist: reconstructArtist({
    artistId: "artist-1",
    handle: "beatboxer_taro",
    ownerUserId: "user-1",
    profile: null,
  }),
};

const mockUpload = vi.fn();
const mockResolveActorState = vi.fn();
const mockArtistProfiles = {
  findByArtistId: vi.fn(),
  findPublishedByHandle: vi.fn(),
  upsert: vi.fn(),
  setPublished: vi.fn(),
};

vi.mock("../../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => ({
    resolveActorState: (subId: string) => mockResolveActorState(subId),
    buildArtistStorageWriteCapabilities: (a: unknown) => ({
      actor: a,
      profileImages: { upload: mockUpload },
    }),
    runWithArtistWriteCapabilities: (
      a: unknown,
      work: (caps: unknown) => Promise<unknown>,
    ) => work({ actor: a, artistProfiles: mockArtistProfiles }),
  }),
}));

const createApp = (sub: string) => {
  const app = new Hono();
  app.use("*", async (c, next) => {
    c.set("auth0User", { sub });
    await next();
  });
  app.route("/:artistId/profile/image", uploadProfileImageRoute);
  app.onError(handleAppError);
  return app;
};

const request = (artistId: string, file: File | string) => {
  const form = new FormData();
  form.append("file", file);
  return createApp("auth0|123").request(`/${artistId}/profile/image`, {
    method: "POST",
    body: form,
  });
};

const createImageFile = ({
  type = "image/jpeg",
  size = 3,
}: { type?: string; size?: number } = {}) =>
  new File([new Uint8Array(size)], "photo.jpg", { type });

describe("POST /artists/:artistId/profile/image", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveActorState.mockResolvedValue({ status: "complete", actor });
    mockUpload.mockResolvedValue(
      ok({ publicUrl: "https://example.supabase.co/public/a.jpg" }),
    );
    mockArtistProfiles.findByArtistId.mockResolvedValue(null);
    mockArtistProfiles.upsert.mockImplementation(
      async (data: ArtistProfilePersistenceData) =>
        reconstructArtistProfile({ ...data }),
    );
  });

  it("Actor と一致する artistId なら画像をアップロードし、集約に URL を書いて imageUrl を返す", async () => {
    const res = await request("artist-1", createImageFile());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toStrictEqual({
      imageUrl: "https://example.supabase.co/public/a.jpg",
    });
    expect(mockUpload).toHaveBeenCalledTimes(1);
    const [{ artistId, image, bytes }] = mockUpload.mock.calls[0];
    expect(artistId).toBe("artist-1");
    expect(image).toStrictEqual({
      contentType: "image/jpeg",
      sizeBytes: 3,
      extension: "jpg",
    });
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(mockArtistProfiles.upsert).toHaveBeenCalledTimes(1);
    expect(mockArtistProfiles.upsert.mock.calls[0][0]).toMatchObject({
      artistId: "artist-1",
      imageUrl: "https://example.supabase.co/public/a.jpg",
    });
  });

  it("既存プロフィールがあれば画像だけを差し替える", async () => {
    mockArtistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "p1",
        artistId: "artist-1",
        published: false,
        name: "Taro",
        imageUrl: "https://example.supabase.co/public/old.jpg",
      }),
    );

    const res = await request("artist-1", createImageFile());

    expect(res.status).toBe(200);
    expect(mockArtistProfiles.upsert.mock.calls[0][0]).toMatchObject({
      id: "p1",
      name: "Taro",
      imageUrl: "https://example.supabase.co/public/a.jpg",
    });
  });

  it("Actor と一致しない artistId は 404 を返し、アップロードしない", async () => {
    const res = await request("other-artist", createImageFile());

    expect(res.status).toBe(404);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("actor が解決できなければ 404 を返し、アップロードしない", async () => {
    mockResolveActorState.mockResolvedValue({ status: "unregistered" });

    const res = await request("artist-1", createImageFile());

    expect(res.status).toBe(404);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("file がファイルでなければ 400 を返し、アップロードしない", async () => {
    const res = await request("artist-1", "not-a-file");

    expect(res.status).toBe(400);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("サポート外の contentType は 422 を返し、アップロードしない", async () => {
    const res = await request(
      "artist-1",
      createImageFile({ type: "image/gif" }),
    );

    expect(res.status).toBe(422);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("サイズ上限超過は 413 を返し、アップロードしない", async () => {
    const res = await request(
      "artist-1",
      createImageFile({ size: 5 * 1024 * 1024 + 1 }),
    );

    expect(res.status).toBe(413);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("本文上限を超えるリクエストは 413 を返し、multipart を解析しない", async () => {
    const res = await request(
      "artist-1",
      createImageFile({ size: 5 * 1024 * 1024 + 1024 + 1 }),
    );

    expect(res.status).toBe(413);
    expect(mockResolveActorState).not.toHaveBeenCalled();
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("空ファイルは 422 を返し、アップロードしない", async () => {
    const res = await request("artist-1", createImageFile({ size: 0 }));

    expect(res.status).toBe(422);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("ストレージの失敗は 502 を返す", async () => {
    mockUpload.mockResolvedValue(
      err(createProfileImageUploadFailedError("Bucket not found")),
    );

    const res = await request("artist-1", createImageFile());

    expect(res.status).toBe(502);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });
});
