import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../../../../domain/artistProfiles/factories";
import type { ArtistProfilePersistenceData } from "../../../../../../domain/artistProfiles/entities";
import { handleAppError } from "../../../../../../errorMap";
import saveProfileRoute from "./index";

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
  app.route("/:artistId/profile", saveProfileRoute);
  app.onError(handleAppError);
  return app;
};

const request = (artistId: string, body: unknown) =>
  createApp("auth0|123").request(`/${artistId}/profile`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /artists/:artistId/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveActorState.mockResolvedValue({ status: "complete", actor });
    mockArtistProfiles.findByArtistId.mockResolvedValue(null);
    mockArtistProfiles.upsert.mockImplementation(
      async (data: ArtistProfilePersistenceData) =>
        reconstructArtistProfile({ ...data }),
    );
  });

  it("Actor と一致する artistId ならプロフィールを保存し、view を返す", async () => {
    const res = await request("artist-1", { name: "Taro", genres: ["bass"] });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.handle).toBe("beatboxer_taro");
    expect(body.profile.name).toBe("Taro");
    expect(mockArtistProfiles.upsert).toHaveBeenCalledTimes(1);
  });

  it("Actor と一致しない artistId は 404 を返し、保存しない", async () => {
    const res = await request("other-artist", { name: "Taro" });

    expect(res.status).toBe(404);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });

  it("actor が解決できなければ 404 を返し、保存しない", async () => {
    mockResolveActorState.mockResolvedValue({ status: "unregistered" });

    const res = await request("artist-1", { name: "Taro" });

    expect(res.status).toBe(404);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });

  it("入力が不正なら 422 を返し、保存しない", async () => {
    const res = await request("artist-1", { imageUrl: "not-a-url" });

    expect(res.status).toBe(422);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });

  it("chapters を渡すと保存され、response の profile.chapters に反映される", async () => {
    const res = await request("artist-1", {
      name: "Taro",
      chapters: [
        { questionCode: "beginning", body: "始めたきっかけ" },
        { questionCode: "turning_point", body: "転機" },
      ],
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.profile.chapters).toStrictEqual([
      { questionCode: "beginning", body: "始めたきっかけ" },
      { questionCode: "turning_point", body: "転機" },
    ]);
    expect(mockArtistProfiles.upsert.mock.calls[0][0].chapters).toEqual([
      { questionCode: "beginning", body: "始めたきっかけ" },
      { questionCode: "turning_point", body: "転機" },
    ]);
  });

  it("MAX_CHAPTERS（3件）を超える chapters はリクエストスキーマ違反として 400 を返し、保存しない", async () => {
    const res = await request("artist-1", {
      chapters: [
        { questionCode: "beginning", body: "始めたきっかけ" },
        { questionCode: "turning_point", body: "転機" },
        { questionCode: "concept", body: "コンセプト" },
        { questionCode: "beginning", body: "4つ目" },
      ],
    });

    expect(res.status).toBe(400);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });
});
