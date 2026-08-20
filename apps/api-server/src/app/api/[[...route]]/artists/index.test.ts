import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import artists from "./index";
import { handleAppError } from "../../../../errorMap";

const mockArtistProfiles = {
  findByArtistId: vi.fn(),
  findPublishedByAccountId: vi.fn(),
  listPublishedSummaries: vi.fn(),
};

vi.mock("../../../../infrastructure/auth0", () => ({
  auth0: { getSession: vi.fn(async () => null) },
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
      "ALL /me/*",
      "POST /me",
      "GET /me/profile",
      "POST /me/profile",
      "POST /me/profile/publish",
      "POST /me/profile/image",
      "POST /:artistId",
      "GET /:artistId/profile",
      "POST /:artistId/profile",
      "POST /:artistId/profile/publish",
      "POST /:artistId/profile/image",
      "GET /:accountId",
    ]);
  });

  it("公開プロフィール一覧は認証を要求しない", async () => {
    mockArtistProfiles.listPublishedSummaries.mockResolvedValue([]);

    const res = await createApp().request("/artists", { method: "GET" });

    expect(res.status).toBe(200);
  });

  it("公開プロフィール詳細は認証を要求しない", async () => {
    mockArtistProfiles.findPublishedByAccountId.mockResolvedValue(null);

    const res = await createApp().request("/artists/taro", { method: "GET" });

    expect(res.status).toBe(404);
  });

  it.each([
    ["POST", "/artists/me"],
    ["GET", "/artists/me/profile"],
    ["POST", "/artists/me/profile"],
    ["POST", "/artists/me/profile/publish"],
    ["POST", "/artists/me/profile/image"],
    ["POST", "/artists/artist-1"],
    ["GET", "/artists/artist-1/profile"],
    ["POST", "/artists/artist-1/profile"],
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
