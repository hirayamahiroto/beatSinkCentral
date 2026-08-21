import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../../../../domain/artistProfiles/factories";
import { handleAppError } from "../../../../../../errorMap";
import publishProfileRoute from "./index";

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

const mockResolveActorState = vi.fn();

vi.mock("../../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => ({
    resolveActorState: (subId: string) => mockResolveActorState(subId),
    runWithArtistWriteCapabilities: (
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
  app.route("/:artistId/profile/publish", publishProfileRoute);
  app.onError(handleAppError);
  return app;
};

const request = (artistId: string, body: unknown) =>
  createApp("auth0|123").request(`/${artistId}/profile/publish`, {
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
    imageUrl: "https://example.com/a.jpg",
    story: "story",
    genres: ["bass"],
    links: [{ type: "x", url: "https://x.com/taro" }],
  });

describe("POST /artists/:artistId/profile/publish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveActorState.mockResolvedValue({ status: "complete", actor });
    mockArtistProfiles.findByArtistId.mockResolvedValue(publishableProfile());
    mockArtistProfiles.setPublished.mockImplementation(async () =>
      reconstructArtistProfile({
        id: "p1",
        artistId: "artist-1",
        published: true,
        name: "Taro",
      }),
    );
  });

  it("Actor と一致する artistId なら公開状態を切り替える", async () => {
    const res = await request("artist-1", { published: true });

    expect(res.status).toBe(200);
    expect(mockArtistProfiles.setPublished).toHaveBeenCalledWith({
      artistId: "artist-1",
      published: true,
    });
  });

  it("Actor と一致しない artistId は 404 を返し、切り替えない", async () => {
    const res = await request("other-artist", { published: true });

    expect(res.status).toBe(404);
    expect(mockArtistProfiles.setPublished).not.toHaveBeenCalled();
  });

  it("actor が解決できなければ 404 を返す", async () => {
    mockResolveActorState.mockResolvedValue({ status: "unregistered" });

    const res = await request("artist-1", { published: true });

    expect(res.status).toBe(404);
    expect(mockArtistProfiles.setPublished).not.toHaveBeenCalled();
  });
});
