import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../../../../../domain/artistProfiles/factories";
import { ok, err } from "../../../../../../../utils/result";
import { createUserNotFoundError } from "../../../../../../../domain/users/policies/assertRegistered";
import getMyProfile from "./index";

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

const mockResolveActor = vi.fn();

vi.mock("../../../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => ({
    resolveActor: (subId: string) => mockResolveActor(subId),
    buildReadCapabilities: (a: unknown) => ({
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
  app.route("/", getMyProfile);
  return app;
};

describe("GET /artists/me/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveActor.mockResolvedValue(ok(actor));
  });

  it("プロフィール未作成なら profile:null を返す", async () => {
    mockArtistProfiles.findByArtistId.mockResolvedValue(null);

    const res = await createApp("auth0|123").request("/", { method: "GET" });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({
      accountId: "beatboxer_taro",
      profile: null,
    });
  });

  it("作成済みなら profile view を返す", async () => {
    mockArtistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "p1",
        artistId: "artist-1",
        published: false,
        name: "Taro",
        genres: ["bass"],
      }),
    );

    const res = await createApp("auth0|123").request("/", { method: "GET" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.profile.name).toBe("Taro");
    expect(mockArtistProfiles.findByArtistId).toHaveBeenCalledWith("artist-1");
  });

  it("actor が解決できなければ 404 を返し、プロフィールを読まない", async () => {
    mockResolveActor.mockResolvedValue(err(createUserNotFoundError()));

    const res = await createApp("auth0|123").request("/", { method: "GET" });

    expect(res.status).toBe(404);
    expect(mockArtistProfiles.findByArtistId).not.toHaveBeenCalled();
  });
});
