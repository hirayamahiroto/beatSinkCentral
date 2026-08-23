import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructArtistProfile } from "../../../../../../domain/artistProfiles/factories";
import { handleAppError } from "../../../../../../errorMap";
import getArtistRoute from "./index";

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
  app.route("/:accountId", getArtistRoute);
  app.onError(handleAppError);
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

  it("書式不正な accountId は DB へ到達せず 422 を返す", async () => {
    const res = await createApp().request("/not%20an%20id", { method: "GET" });

    expect(res.status).toBe(422);
    expect(await res.json()).toStrictEqual({
      error: "Invalid accountId format",
    });
    expect(mockArtistProfiles.findPublishedByAccountId).not.toHaveBeenCalled();
  });

  it("255 文字を超える accountId は param 検証で 400 を返す", async () => {
    const res = await createApp().request(`/${"a".repeat(256)}`, {
      method: "GET",
    });

    expect(res.status).toBe(400);
    expect(mockArtistProfiles.findPublishedByAccountId).not.toHaveBeenCalled();
  });
});
