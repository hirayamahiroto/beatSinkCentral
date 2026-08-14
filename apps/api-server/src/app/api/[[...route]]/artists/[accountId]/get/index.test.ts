import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructArtistProfile } from "../../../../../../domain/artistProfiles/factories";
import getPublicProfile from "./index";

const mockArtistProfiles = {
  findByArtistId: vi.fn(),
  findPublishedByAccountId: vi.fn(),
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
  app.route("/", getPublicProfile);
  return app;
};

describe("GET /artists/:accountId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("公開プロフィールを accountId と view で返す", async () => {
    mockArtistProfiles.findPublishedByAccountId.mockResolvedValue(
      reconstructArtistProfile({
        id: "p1",
        artistId: "artist-1",
        published: true,
        name: "Taro",
        imageUrl: "https://example.com/a.png",
        story: "私の歩み",
        genres: ["bass"],
        links: [{ type: "x", url: "https://x.com/taro" }],
      }),
    );

    const res = await createApp().request("/beatboxer_taro", { method: "GET" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.accountId).toBe("beatboxer_taro");
    expect(body.profile.name).toBe("Taro");
    expect(mockArtistProfiles.findPublishedByAccountId).toHaveBeenCalledWith(
      "beatboxer_taro",
    );
  });

  it("公開プロフィールが無ければ 404 を返す", async () => {
    mockArtistProfiles.findPublishedByAccountId.mockResolvedValue(null);

    const res = await createApp().request("/beatboxer_taro", { method: "GET" });

    expect(res.status).toBe(404);
  });
});
