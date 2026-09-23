import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../domain/artists/factories";
import { toPersistence } from "../../../../../../domain/artistProfiles/behaviors";
import type { StoredProfile } from "../../../../../../domain/artistProfiles/entities";
import { handleAppError } from "../../../../../../errorMap";
import choosePresentationPatternRoute from "./index";
import { createCapabilityDepsMock } from "../../../../../../infrastructure/capabilities/testDoubles";

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

const { deps, artistProfiles, resolveActorState } = createCapabilityDepsMock();

vi.mock("../../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => deps,
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
    resolveActorState.mockResolvedValue({ status: "complete", actor });
    artistProfiles.load.mockResolvedValue({
      kind: "noProfile",
      artistId: "artist-1",
    });
    artistProfiles.save.mockImplementation(
      async (state: StoredProfile) => state,
    );
  });

  it("パターンを保存し、presentation だけを返す", async () => {
    const res = await request("artist-1", { patternCode: "zoom_dive" });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({
      presentation: { patternCode: "zoom_dive" },
    });
    expect(
      toPersistence(artistProfiles.save.mock.calls[0][0])
        .presentationPatternCode,
    ).toBe("zoom_dive");
  });

  it("未知のパターンは 422 を返し保存しない", async () => {
    const res = await request("artist-1", { patternCode: "carousel" });

    expect(res.status).toBe(422);
    expect(await res.json()).toStrictEqual({
      error: "Invalid presentation pattern",
      code: "InvalidPresentationPatternError",
    });
    expect(artistProfiles.save).not.toHaveBeenCalled();
  });

  it("patternCode が無ければ 400 を返す", async () => {
    const res = await request("artist-1", {});

    expect(res.status).toBe(400);
    expect(artistProfiles.save).not.toHaveBeenCalled();
  });

  it("Actor と一致しない artistId は 404 を返し、保存しない", async () => {
    const res = await request("artist-other", { patternCode: "interview" });

    expect(res.status).toBe(404);
    expect(artistProfiles.save).not.toHaveBeenCalled();
  });
});
