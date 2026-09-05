import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../../../../domain/artistProfiles/factories";
import type { ArtistProfilePersistenceData } from "../../../../../../domain/artistProfiles/entities";
import { handleAppError } from "../../../../../../errorMap";
import writeStoryChapterRoute from "./index";

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
  app.route("/:artistId/story/chapters/:chapterKey", writeStoryChapterRoute);
  app.onError(handleAppError);
  return app;
};

const request = (artistId: string, chapterKey: string, body: unknown) =>
  createApp("auth0|123").request(`/${artistId}/story/chapters/${chapterKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /artists/:artistId/story/chapters/:chapterKey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveActorState.mockResolvedValue({ status: "complete", actor });
    mockArtistProfiles.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "p1",
        artistId: "artist-1",
        published: false,
        name: "Taro",
        chapters: [{ questionCode: "beginning", body: "私の歩み" }],
      }),
    );
    mockArtistProfiles.upsert.mockImplementation(
      async (data: ArtistProfilePersistenceData) =>
        reconstructArtistProfile({ ...data }),
    );
  });

  it("Actor と一致する artistId なら章を書き、story だけを返す", async () => {
    const res = await request("artist-1", "turning_point", { body: "転機" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toStrictEqual({
      story: {
        chapters: [
          { key: "beginning", body: "私の歩み" },
          { key: "turning_point", body: "転機" },
        ],
      },
    });
    expect(mockArtistProfiles.upsert).toHaveBeenCalledTimes(1);
    expect(mockArtistProfiles.upsert.mock.calls[0][0]).toMatchObject({
      name: "Taro",
      chapters: [
        { questionCode: "beginning", body: "私の歩み" },
        { questionCode: "turning_point", body: "転機" },
      ],
    });
  });

  it("本文が空なら章を消す", async () => {
    const res = await request("artist-1", "beginning", { body: "" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toStrictEqual({ story: { chapters: [] } });
  });

  it("未知の chapterKey は 422 を返し、保存しない", async () => {
    const res = await request("artist-1", "unknown", { body: "本文" });

    expect(res.status).toBe(422);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });

  it("body が無ければ 400 を返し、保存しない", async () => {
    const res = await request("artist-1", "beginning", {});

    expect(res.status).toBe(400);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });

  it("Actor と一致しない artistId は 404 を返し、保存しない", async () => {
    const res = await request("other-artist", "beginning", { body: "本文" });

    expect(res.status).toBe(404);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });

  it("actor が解決できなければ 404 を返し、保存しない", async () => {
    mockResolveActorState.mockResolvedValue({ status: "unregistered" });

    const res = await request("artist-1", "beginning", { body: "本文" });

    expect(res.status).toBe(404);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });
});
