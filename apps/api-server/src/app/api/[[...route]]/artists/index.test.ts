import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import artists from "./index";
import { handleAppError } from "../../../../errorMap";

const mockArtistProfiles = {
  findByArtistId: vi.fn(),
  findPublishedByHandle: vi.fn(),
  listPublishedSummaries: vi.fn(),
};

vi.mock("../../../../infrastructure/auth0", () => ({
  getAuth0: () => ({ getSession: async () => null }),
}));

vi.mock("../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => ({
    buildPublicReadCapabilities: () => ({
      artistProfiles: mockArtistProfiles,
    }),
  }),
}));

const createApp = () =>
  new Hono().route("/artists", artists).onError(handleAppError);

const routeSurface = () => [
  ...new Set(artists.routes.map((route) => `${route.method} ${route.path}`)),
];

describe("/artists ルーターの合成", () => {
  beforeEach(() => vi.clearAllMocks());

  it("配下のエンドポイントを実 URL として公開する", () => {
    expect(routeSurface()).toEqual([
      "GET /",
      "GET /:handle",
      "ALL /:artistId/*",
      "POST /:artistId",
      "GET /:artistId/profile",
      "POST /:artistId/attributes",
      "POST /:artistId/story/chapters/:chapterKey",
      "POST /:artistId/links",
      "POST /:artistId/presentation",
      "POST /:artistId/profile/publish",
      "POST /:artistId/profile/image",
    ]);
  });

  it("公開プロフィール一覧は認証を要求しない", async () => {
    mockArtistProfiles.listPublishedSummaries.mockResolvedValue([]);

    const res = await createApp().request("/artists", { method: "GET" });

    expect(res.status).toBe(200);
  });

  it("公開プロフィール詳細は認証を要求しない", async () => {
    mockArtistProfiles.findPublishedByHandle.mockResolvedValue(null);

    const res = await createApp().request("/artists/taro", { method: "GET" });

    expect(res.status).toBe(404);
  });

  it.each([
    ["POST", "/artists/artist-1"],
    ["GET", "/artists/artist-1/profile"],
    ["POST", "/artists/artist-1/attributes"],
    ["POST", "/artists/artist-1/story/chapters/beginning"],
    ["POST", "/artists/artist-1/links"],
    ["POST", "/artists/artist-1/presentation"],
    ["POST", "/artists/artist-1/profile/publish"],
    ["POST", "/artists/artist-1/profile/image"],
  ])("%s %s は認証を要求する", async (method, path) => {
    const res = await createApp().request(path, {
      method,
      headers: { "content-type": "application/json" },
      body: method === "POST" ? "{}" : undefined,
    });

    expect(res.status).toBe(401);
  });
});
