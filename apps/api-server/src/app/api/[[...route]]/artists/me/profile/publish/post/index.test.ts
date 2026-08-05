import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../../../../../../domain/artistProfiles/factories";
import { ok, err } from "../../../../../../../../utils/result";
import { createUserNotFoundError } from "../../../../../../../../domain/users/policies/assertRegistered";
import publishMyProfile from "./index";

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
  upsert: vi.fn(),
  setPublished: vi.fn(),
};

const mockResolveActor = vi.fn();

vi.mock("../../../../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => ({
    resolveActor: (subId: string) => mockResolveActor(subId),
    runWithWriteCapabilities: (
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
  app.route("/", publishMyProfile);
  return app;
};

const request = (body: unknown) =>
  createApp("auth0|123").request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const publishableProfile = () =>
  reconstructArtistProfile({
    id: "p1",
    artistId: "artist-1",
    published: false,
    name: "Taro",
    imageUrl: "https://example.com/a.png",
    story: "私の歩み",
    genres: ["bass"],
    links: [{ type: "x", url: "https://x.com/taro" }],
  });

describe("POST /artists/me/profile/publish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveActor.mockResolvedValue(ok(actor));
  });

  it("最小核が揃ったプロフィールを公開し published:true を返す", async () => {
    const publishable = publishableProfile();
    mockArtistProfiles.findByArtistId.mockResolvedValue(publishable);
    mockArtistProfiles.setPublished.mockResolvedValue(publishable.publish());

    const res = await request({ published: true });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ published: true });
    expect(mockArtistProfiles.setPublished).toHaveBeenCalledWith({
      artistId: "artist-1",
      published: true,
    });
  });

  it("最小核が欠けていれば 422 を返し、公開しない", async () => {
    mockArtistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "p1",
        artistId: "artist-1",
        published: false,
        name: "Taro",
      }),
    );

    const res = await request({ published: true });

    expect(res.status).toBe(422);
    expect(mockArtistProfiles.setPublished).not.toHaveBeenCalled();
  });

  it("プロフィールが存在しなければ 404 を返す", async () => {
    mockArtistProfiles.findByArtistId.mockResolvedValue(null);

    const res = await request({ published: true });

    expect(res.status).toBe(404);
    expect(mockArtistProfiles.setPublished).not.toHaveBeenCalled();
  });

  it("actor が解決できなければ 404 を返し、プロフィールを読まない", async () => {
    mockResolveActor.mockResolvedValue(err(createUserNotFoundError()));

    const res = await request({ published: true });

    expect(res.status).toBe(404);
    expect(mockArtistProfiles.findByArtistId).not.toHaveBeenCalled();
  });
});
