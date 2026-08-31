import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructArtistProfile } from "../../../../../../domain/artistProfiles/factories";
import { handleAppError } from "../../../../../../errorMap";
import getArtistRoute from "./index";

const mockArtistProfiles = {
  findByArtistId: vi.fn(),
  findPublishedByHandle: vi.fn(),
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
  app.route("/:handle", getArtistRoute);
  app.onError(handleAppError);
  return app;
};

describe("GET /artists/:handle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("公開プロフィールを handle と view で返す", async () => {
    mockArtistProfiles.findPublishedByHandle.mockResolvedValue(
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
    expect(body.handle).toBe("beatboxer_taro");
    expect(body.profile.name).toBe("Taro");
    expect(mockArtistProfiles.findPublishedByHandle).toHaveBeenCalledWith(
      "beatboxer_taro",
    );
  });

  it("公開必須項目が欠けた公開プロフィールは契約違反として 500 を返す", async () => {
    mockArtistProfiles.findPublishedByHandle.mockResolvedValue(
      reconstructArtistProfile({
        id: "p1",
        artistId: "artist-1",
        published: true,
        name: "Taro",
        imageUrl: null,
        story: "私の歩み",
        genres: [],
        links: [{ type: "x", url: "https://x.com/taro" }],
      }),
    );

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const res = await createApp().request("/beatboxer_taro", { method: "GET" });

    expect(res.status).toBe(500);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(JSON.parse(consoleError.mock.calls[0][0])).toMatchObject({
      event: "AppError",
      errorType: "ResponseContractViolationError",
      context: { issuePaths: ["profile.imageUrl", "profile.genres"] },
    });
    consoleError.mockRestore();
  });

  it("公開プロフィールが無ければ 404 を返す", async () => {
    mockArtistProfiles.findPublishedByHandle.mockResolvedValue(null);

    const res = await createApp().request("/beatboxer_taro", { method: "GET" });

    expect(res.status).toBe(404);
  });

  it("書式不正な handle は DB へ到達せず 422 を返す", async () => {
    const res = await createApp().request("/not%20an%20id", { method: "GET" });

    expect(res.status).toBe(422);
    expect(await res.json()).toStrictEqual({
      error: "Invalid handle format",
      code: "InvalidHandleFormatError",
    });
    expect(mockArtistProfiles.findPublishedByHandle).not.toHaveBeenCalled();
  });

  it("255 文字を超える handle は param 検証で 400 を返す", async () => {
    const res = await createApp().request(`/${"a".repeat(256)}`, {
      method: "GET",
    });

    expect(res.status).toBe(400);
    expect(mockArtistProfiles.findPublishedByHandle).not.toHaveBeenCalled();
  });
});
