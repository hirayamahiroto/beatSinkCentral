import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../../../../domain/artistProfiles/factories";
import { handleAppError } from "../../../../../../errorMap";
import getProfileRoute from "./index";

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
};

const mockResolveActorState = vi.fn();

vi.mock("../../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => ({
    resolveActorState: (subId: string) => mockResolveActorState(subId),
    buildArtistReadCapabilities: (a: unknown) => ({
      actor: a,
      artistProfiles: mockArtistProfiles,
    }),
  }),
}));

const createApp = (sub: string) => {
  const app = new Hono();
  app.use("*", async (c, next) => {
    c.set("auth0User", { sub });
    await next();
  });
  app.route("/:artistId/profile", getProfileRoute);
  app.onError(handleAppError);
  return app;
};

const request = (artistId: string) =>
  createApp("auth0|123").request(`/${artistId}/profile`, { method: "GET" });

describe("GET /artists/:artistId/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveActorState.mockResolvedValue({ status: "complete", actor });
  });

  it("Actor と一致する artistId なら集約の構造と公開可能性を返す", async () => {
    mockArtistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "p1",
        artistId: "artist-1",
        published: false,
        name: "Taro",
        chapters: [{ questionCode: "beginning", body: "私の歩み" }],
        links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
      }),
    );

    const res = await request("artist-1");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toStrictEqual({
      handle: "beatboxer_taro",
      profile: {
        attributes: {
          name: "Taro",
          imageUrl: null,
          tagline: null,
          genres: [],
          activityInfo: null,
        },
        story: { chapters: [{ key: "beginning", body: "私の歩み" }] },
        links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
        presentation: { patternCode: null },
        published: false,
      },
      publishability: { ok: false, missingFields: ["imageUrl", "genres"] },
    });
    expect(mockArtistProfiles.findByArtistId).toHaveBeenCalledWith("artist-1");
  });

  it("プロフィール未作成なら profile と publishability を null で返す", async () => {
    mockArtistProfiles.findByArtistId.mockResolvedValue(null);

    const res = await request("artist-1");

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({
      handle: "beatboxer_taro",
      profile: null,
      publishability: null,
    });
  });

  it("Actor と一致しない artistId は 404 を返し、プロフィールを読まない", async () => {
    const res = await request("other-artist");

    expect(res.status).toBe(404);
    expect(mockArtistProfiles.findByArtistId).not.toHaveBeenCalled();
  });

  it("actor が解決できなければ 404 を返す", async () => {
    mockResolveActorState.mockResolvedValue({ status: "unregistered" });

    const res = await request("artist-1");

    expect(res.status).toBe(404);
    expect(mockArtistProfiles.findByArtistId).not.toHaveBeenCalled();
  });
});
