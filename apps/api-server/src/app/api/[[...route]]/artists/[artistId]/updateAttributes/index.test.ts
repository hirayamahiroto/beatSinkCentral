import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../../../../domain/artistProfiles/factories";
import type { ArtistProfilePersistenceData } from "../../../../../../domain/artistProfiles/entities";
import { handleAppError } from "../../../../../../errorMap";
import updateAttributesRoute from "./index";

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

const mockArtistProfiles = {
  findByArtistId: vi.fn(),
  findPublishedByHandle: vi.fn(),
  upsert: vi.fn(),
  setPublished: vi.fn(),
};

const mockResolveActorState = vi.fn();

vi.mock("../../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => ({
    resolveActorState: (subId: string) => mockResolveActorState(subId),
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
  app.route("/:artistId/attributes", updateAttributesRoute);
  app.onError(handleAppError);
  return app;
};

const request = (artistId: string, body: unknown) =>
  createApp("auth0|123").request(`/${artistId}/attributes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /artists/:artistId/attributes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveActorState.mockResolvedValue({ status: "complete", actor });
    mockArtistProfiles.findByArtistId.mockResolvedValue(null);
    mockArtistProfiles.upsert.mockImplementation(
      async (data: ArtistProfilePersistenceData) =>
        reconstructArtistProfile({ ...data }),
    );
  });

  it("Actor と一致する artistId なら属性を保存し、attributes だけを返す", async () => {
    const res = await request("artist-1", {
      name: "Taro",
      tagline: "音で旅する",
      genres: ["bass"],
      activityInfo: "東京 / ソロ",
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toStrictEqual({
      attributes: {
        name: "Taro",
        imageUrl: null,
        tagline: "音で旅する",
        genres: ["bass"],
        activityInfo: "東京 / ソロ",
      },
    });
    expect(mockArtistProfiles.upsert).toHaveBeenCalledTimes(1);
    expect(mockArtistProfiles.upsert.mock.calls[0][0]).toMatchObject({
      artistId: "artist-1",
      name: "Taro",
      genres: ["bass"],
    });
  });

  it("他の構造（imageUrl / chapters / links）はボディに渡しても無視される", async () => {
    mockArtistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "p1",
        artistId: "artist-1",
        published: false,
        imageUrl: "https://example.com/keep.png",
        chapters: [{ questionCode: "beginning", body: "保持される章" }],
      }),
    );

    const res = await request("artist-1", {
      name: "Taro",
      genres: [],
      imageUrl: "https://example.com/ignored.png",
      chapters: [{ questionCode: "beginning", body: "無視される章" }],
      links: [{ linkTypeCode: "x", url: "https://x.com/ignored" }],
    });

    expect(res.status).toBe(200);
    expect(mockArtistProfiles.upsert.mock.calls[0][0]).toMatchObject({
      imageUrl: "https://example.com/keep.png",
      chapters: [{ questionCode: "beginning", body: "保持される章" }],
      links: [],
    });
  });

  it.each([
    ["name", { genres: ["bass"] }],
    ["genres", { name: "Taro" }],
  ])(
    "属性は丸ごと差し替えのため %s が無いリクエストは 400 を返し、保存しない",
    async (_, body) => {
      const res = await request("artist-1", body);

      expect(res.status).toBe(400);
      expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
    },
  );

  it("Actor と一致しない artistId は 404 を返し、保存しない", async () => {
    const res = await request("other-artist", { name: "Taro", genres: [] });

    expect(res.status).toBe(404);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });

  it("actor が解決できなければ 404 を返し、保存しない", async () => {
    mockResolveActorState.mockResolvedValue({ status: "unregistered" });

    const res = await request("artist-1", { name: "Taro", genres: [] });

    expect(res.status).toBe(404);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });

  it("入力が不正なら 422 を返し、保存しない", async () => {
    const res = await request("artist-1", {
      name: "a".repeat(256),
      genres: [],
    });

    expect(res.status).toBe(422);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });

  it("MAX_GENRES（20件）を超える genres はリクエストスキーマ違反として 400 を返し、保存しない", async () => {
    const res = await request("artist-1", {
      name: "Taro",
      genres: Array(21).fill("bass"),
    });

    expect(res.status).toBe(400);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });
});
