import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../domain/artists/factories";
import { reconstructStoredProfile } from "../../../../../../domain/artistProfiles/factories";
import type { PublishedProfile } from "../../../../../../domain/artistProfiles/entities";
import { handleThrownError } from "../../../../../../errorMap";
import publishProfileRoute from "./index";
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
  app.route("/:artistId/profile/publish", publishProfileRoute);
  app.onError(handleThrownError);
  return app;
};

const request = (artistId: string, body: unknown) =>
  createApp("auth0|123").request(`/${artistId}/profile/publish`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const publishableProfile = () =>
  reconstructStoredProfile({
    id: "p1",
    artistId: "artist-1",
    published: false,
    name: "Taro",
    imageUrl: "https://example.com/a.jpg",
    chapters: [{ questionCode: "beginning", body: "story" }],
    genres: ["bass"],
    links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
  });

describe("POST /artists/:artistId/profile/publish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveActorState.mockResolvedValue({ status: "complete", actor });
    artistProfiles.load.mockResolvedValue(publishableProfile());
    artistProfiles.publish.mockImplementation(
      async (state: PublishedProfile) => state,
    );
  });

  it("Actor と一致する artistId なら公開状態を切り替える", async () => {
    const res = await request("artist-1", { published: true });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toStrictEqual({ published: true });
    expect(artistProfiles.publish).toHaveBeenCalledTimes(1);
    expect(artistProfiles.publish.mock.calls[0][0].kind).toBe("published");
  });

  it("Actor と一致しない artistId は 404 を返し、切り替えない", async () => {
    const res = await request("other-artist", { published: true });

    expect(res.status).toBe(404);
    expect(artistProfiles.publish).not.toHaveBeenCalled();
  });

  it("actor が解決できなければ 404 を返す", async () => {
    resolveActorState.mockResolvedValue({ status: "unregistered" });

    const res = await request("artist-1", { published: true });

    expect(res.status).toBe(404);
    expect(artistProfiles.publish).not.toHaveBeenCalled();
  });
});
