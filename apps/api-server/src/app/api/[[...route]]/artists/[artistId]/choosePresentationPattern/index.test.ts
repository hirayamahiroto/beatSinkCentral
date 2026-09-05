import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../../../../domain/artistProfiles/factories";
import type { ArtistProfilePersistenceData } from "../../../../../../domain/artistProfiles/entities";
import { handleAppError } from "../../../../../../errorMap";
import choosePresentationPatternRoute from "./index";

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
  app.route("/:artistId/presentation", choosePresentationPatternRoute);
  app.onError(handleAppError);
  return app;
};

const request = (artistId: string, body: unknown) =>
  createApp("auth0|123").request(`/${artistId}/presentation`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /artists/:artistId/presentation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveActorState.mockResolvedValue({ status: "complete", actor });
    mockArtistProfiles.findByArtistId.mockResolvedValue(null);
    mockArtistProfiles.upsert.mockImplementation(
      async (data: ArtistProfilePersistenceData) =>
        reconstructArtistProfile({ ...data }),
    );
  });

  it("パターンを保存し、presentation だけを返す", async () => {
    const res = await request("artist-1", { patternCode: "zoom_dive" });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({
      presentation: { patternCode: "zoom_dive" },
    });
    expect(
      mockArtistProfiles.upsert.mock.calls[0][0].presentationPatternCode,
    ).toBe("zoom_dive");
  });

  it("未知のパターンは 422 を返し保存しない", async () => {
    const res = await request("artist-1", { patternCode: "carousel" });

    expect(res.status).toBe(422);
    expect(await res.json()).toStrictEqual({
      error: "Invalid presentation pattern",
      code: "InvalidPresentationPatternError",
    });
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });

  it("patternCode が無ければ 400 を返す", async () => {
    const res = await request("artist-1", {});

    expect(res.status).toBe(400);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });

  it("Actor と一致しない artistId は 404 を返し、保存しない", async () => {
    const res = await request("artist-other", { patternCode: "interview" });

    expect(res.status).toBe(404);
    expect(mockArtistProfiles.upsert).not.toHaveBeenCalled();
  });
});
