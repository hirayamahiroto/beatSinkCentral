import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../domain/artists/factories";
import { handleThrownError } from "../../../../../../errorMap";
import updateHandleRoute from "./index";
import { createCapabilityDepsMock } from "../../../../../../infrastructure/capabilities/testDoubles";

const { deps, artistHandleHistories, artists, resolveActorState } =
  createCapabilityDepsMock();

vi.mock("../../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => deps,
}));

const owner = reconstructUser({
  id: "user-1",
  subId: "auth0|123",
  email: "test@example.com",
});

const ownedArtist = reconstructArtist({
  artistId: "artist-1",
  handle: "old_handle",
  ownerUserId: owner.getId(),
  profile: null,
});

const createApp = () => {
  const app = new Hono();
  app.use("*", async (c, next) => {
    c.set("auth0User", { sub: "auth0|123" });
    await next();
  });
  app.route("/:artistId", updateHandleRoute);
  app.onError(handleThrownError);
  return app;
};

const request = (artistId: string, body: unknown) =>
  createApp().request(`/${artistId}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /artists/:artistId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveActorState.mockResolvedValue({
      status: "complete",
      actor: { user: owner, artist: ownedArtist },
    });
    artists.updateHandle.mockImplementation(async () =>
      reconstructArtist({
        artistId: "artist-1",
        handle: "new_handle",
        ownerUserId: owner.getId(),
        profile: null,
      }),
    );
  });

  it("Actor と一致する artistId なら handle を更新する", async () => {
    const res = await request("artist-1", { handle: "new_handle" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ artistId: "artist-1", handle: "new_handle" });
    expect(artists.updateHandle).toHaveBeenCalledWith({
      artistId: "artist-1",
      handle: "new_handle",
    });
    expect(artistHandleHistories.record).toHaveBeenCalledExactlyOnceWith({
      id: expect.any(String),
      artistId: "artist-1",
      oldHandle: "old_handle",
      newHandle: "new_handle",
      changedByUserId: "user-1",
    });
  });

  it("Actor と一致しない artistId は 404 を返し、更新しない", async () => {
    const res = await request("other-artist", { handle: "new_handle" });

    expect(res.status).toBe(404);
    expect(artists.updateHandle).not.toHaveBeenCalled();
    expect(artistHandleHistories.record).not.toHaveBeenCalled();
  });

  it("actor が解決できなければ 404 を返す", async () => {
    resolveActorState.mockResolvedValue({ status: "unregistered" });

    const res = await request("artist-1", { handle: "new_handle" });

    expect(res.status).toBe(404);
    expect(artists.updateHandle).not.toHaveBeenCalled();
  });

  it("handle が空なら 400 を返し、更新しない", async () => {
    const res = await request("artist-1", { handle: "" });

    expect(res.status).toBe(400);
    expect(artists.updateHandle).not.toHaveBeenCalled();
  });
});
