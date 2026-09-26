import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../domain/artists/factories";
import { reconstructStoredProfile } from "../../../../../../domain/artistProfiles/factories";
import { toPersistence } from "../../../../../../domain/artistProfiles/behaviors";
import type { StoredProfile } from "../../../../../../domain/artistProfiles/entities";
import { handleThrownError } from "../../../../../../errorMap";
import replaceLinksRoute from "./index";
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
  app.route("/:artistId/links", replaceLinksRoute);
  app.onError(handleThrownError);
  return app;
};

const request = (artistId: string, body: unknown) =>
  createApp("auth0|123").request(`/${artistId}/links`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const links = [
  { linkTypeCode: "youtube", url: "https://youtube.com/@taro" },
  { linkTypeCode: "x", url: "https://x.com/taro" },
];

describe("POST /artists/:artistId/links", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveActorState.mockResolvedValue({ status: "complete", actor });
    artistProfiles.load.mockResolvedValue(
      reconstructStoredProfile({
        id: "p1",
        artistId: "artist-1",
        published: false,
        name: "Taro",
        links: [{ linkTypeCode: "instagram", url: "https://instagram.com/t" }],
      }),
    );
    artistProfiles.save.mockImplementation(
      async (state: StoredProfile) => state,
    );
  });

  it("Actor と一致する artistId ならリンク集合を差し替え、links だけを返す", async () => {
    const res = await request("artist-1", { links });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toStrictEqual({ links });
    expect(artistProfiles.save).toHaveBeenCalledTimes(1);
    expect(toPersistence(artistProfiles.save.mock.calls[0][0])).toMatchObject({
      name: "Taro",
      links,
    });
  });

  it("空配列で全リンクを消せる", async () => {
    const res = await request("artist-1", { links: [] });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ links: [] });
  });

  it("links が無ければ 400 を返し、保存しない", async () => {
    const res = await request("artist-1", {});

    expect(res.status).toBe(400);
    expect(artistProfiles.save).not.toHaveBeenCalled();
  });

  it("MAX_LINKS（20件）を超える links は 400 を返し、保存しない", async () => {
    const res = await request("artist-1", {
      links: Array(21).fill({ linkTypeCode: "x", url: "https://x.com/t" }),
    });

    expect(res.status).toBe(400);
    expect(artistProfiles.save).not.toHaveBeenCalled();
  });

  it("不正な url は 422 を返し、保存しない", async () => {
    const res = await request("artist-1", {
      links: [{ linkTypeCode: "x", url: "not-a-url" }],
    });

    expect(res.status).toBe(422);
    expect(artistProfiles.save).not.toHaveBeenCalled();
  });

  it("Actor と一致しない artistId は 404 を返し、保存しない", async () => {
    const res = await request("other-artist", { links });

    expect(res.status).toBe(404);
    expect(artistProfiles.save).not.toHaveBeenCalled();
  });
});
