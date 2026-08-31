import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import listArtistsRoute from "./index";

const mockArtistProfiles = {
  findByArtistId: vi.fn(),
  findPublishedByHandle: vi.fn(),
  listPublishedSummaries: vi.fn(),
};

vi.mock("../../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => ({
    buildPublicReadCapabilities: () => ({
      artistProfiles: mockArtistProfiles,
    }),
  }),
}));

const createApp = () => {
  const app = new Hono();
  app.route("/", listArtistsRoute);
  return app;
};

describe("GET /artists", () => {
  beforeEach(() => vi.clearAllMocks());

  it("公開プロフィールの一覧を返す", async () => {
    mockArtistProfiles.listPublishedSummaries.mockResolvedValue([
      { handle: "taro", name: "Taro", imageUrl: "https://e.com/a.png" },
    ]);

    const res = await createApp().request("/", { method: "GET" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.profiles).toEqual([
      { handle: "taro", name: "Taro", imageUrl: "https://e.com/a.png" },
    ]);
  });

  it("公開プロフィールが無ければ空配列を 200 で返す", async () => {
    mockArtistProfiles.listPublishedSummaries.mockResolvedValue([]);

    const res = await createApp().request("/", { method: "GET" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.profiles).toEqual([]);
  });
});
