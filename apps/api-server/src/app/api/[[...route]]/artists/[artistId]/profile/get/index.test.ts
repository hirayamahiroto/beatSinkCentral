import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../../../../../domain/artistProfiles/factories";
import { handleAppError } from "../../../../../../../errorMap";
import getProfileRoute from "./index";

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

const mockArtistProfiles = {
  findByArtistId: vi.fn(),
  findPublishedByAccountId: vi.fn(),
};

const mockResolveActorState = vi.fn();

vi.mock("../../../../../../../middlewares/auth0", () => ({
  requireAuthMiddleware: async (
    _c: unknown,
    next: () => Promise<void>,
  ): Promise<void> => next(),
}));

vi.mock("../../../../../../../infrastructure/capabilities", () => ({
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
  app.route("/", getProfileRoute);
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

  it("Actor と一致する artistId ならプロフィールを返す", async () => {
    mockArtistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "p1",
        artistId: "artist-1",
        published: false,
        name: "Taro",
      }),
    );

    const res = await request("artist-1");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.profile.name).toBe("Taro");
    expect(mockArtistProfiles.findByArtistId).toHaveBeenCalledWith("artist-1");
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
