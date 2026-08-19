import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../../../../../domain/artistProfiles/factories";
import type { ArtistProfilePersistenceData } from "../../../../../../../domain/artistProfiles/entities";
import { handleAppError } from "../../../../../../../errorMap";
import saveMyProfileRoute from "./index";

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

vi.mock("../../../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => ({
    resolveActorState: (subId: string) => mockResolveActorState(subId),
    buildArtistReadCapabilities: (a: unknown) => ({
      actor: a,
      artistProfiles: mockArtistProfiles,
    }),
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
  app.route("/", saveMyProfileRoute);
  app.onError(handleAppError);
  return app;
};

const request = (body: unknown) =>
  createApp("auth0|123").request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /artists/me/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveActorState.mockResolvedValue({ status: "complete", actor });
    mockArtistProfiles.findByArtistId.mockResolvedValue(null);
    mockArtistProfiles.upsert.mockImplementation(
      async (data: ArtistProfilePersistenceData) =>
        reconstructArtistProfile({ ...data }),
    );
  });

  it("プロフィールを保存し、view を返す", async () => {
    const res = await request({ name: "Taro", genres: ["bass"] });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.accountId).toBe("beatboxer_taro");
    expect(body.profile.name).toBe("Taro");
    expect(mockArtistProfiles.upsert).toHaveBeenCalledTimes(1);
  });

  it("actor が解決できなければ 404 を返し、保存しない", async () => {
    mockResolveActorState.mockResolvedValue({ status: "unregistered" });

    const res = await request({ name: "Taro" });

    expect(res.status).toBe(404);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });

  it("入力が不正なら 422 を返し、保存しない", async () => {
    const res = await request({ imageUrl: "not-a-url" });

    expect(res.status).toBe(422);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });

  it("genres が上限を超えたら 400 を返し、保存しない", async () => {
    const res = await request({ genres: Array(21).fill("bass") });

    expect(res.status).toBe(400);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });

  it("links が上限を超えたら 400 を返し、保存しない", async () => {
    const res = await request({
      links: Array(21).fill({ type: "x", url: "https://x.com/taro" }),
    });

    expect(res.status).toBe(400);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });

  it("上限ちょうどの genres / links は保存する", async () => {
    const res = await request({
      genres: Array(20).fill("bass"),
      links: Array(20).fill({ type: "x", url: "https://x.com/taro" }),
    });

    expect(res.status).toBe(200);
    expect(mockArtistProfiles.upsert).toHaveBeenCalledTimes(1);
  });

  it("パースできないボディは 400 を返し、保存しない", async () => {
    const res = await createApp("auth0|123").request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{ not json",
    });

    expect(res.status).toBe(400);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });
});
