import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../domain/artists/factories";
import { handleAppError } from "../../../../../../errorMap";
import updateHandleRoute from "./index";

const mockArtists = {
  save: vi.fn(),
  findByUserId: vi.fn(),
  findByHandle: vi.fn(),
  updateHandle: vi.fn(),
};

const mockArtistHandleHistories = {
  record: vi.fn(),
};

const mockResolveActorState = vi.fn();

vi.mock("../../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => ({
    resolveActorState: (subId: string) => mockResolveActorState(subId),
    runWithArtistWriteCapabilities: (
      actor: unknown,
      work: (caps: unknown) => Promise<unknown>,
    ) =>
      work({
        actor,
        artists: mockArtists,
        artistHandleHistories: mockArtistHandleHistories,
      }),
  }),
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
  app.onError(handleAppError);
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
    mockResolveActorState.mockResolvedValue({
      status: "complete",
      actor: { user: owner, artist: ownedArtist },
    });
    mockArtists.updateHandle.mockImplementation(async () =>
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
    expect(mockArtists.updateHandle).toHaveBeenCalledWith({
      artistId: "artist-1",
      handle: "new_handle",
    });
    expect(mockArtistHandleHistories.record).toHaveBeenCalledExactlyOnceWith({
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
    expect(mockArtists.updateHandle).not.toHaveBeenCalled();
    expect(mockArtistHandleHistories.record).not.toHaveBeenCalled();
  });

  it("actor が解決できなければ 404 を返す", async () => {
    mockResolveActorState.mockResolvedValue({ status: "unregistered" });

    const res = await request("artist-1", { handle: "new_handle" });

    expect(res.status).toBe(404);
    expect(mockArtists.updateHandle).not.toHaveBeenCalled();
  });

  it("handle が空なら 400 を返し、更新しない", async () => {
    const res = await request("artist-1", { handle: "" });

    expect(res.status).toBe(400);
    expect(mockArtists.updateHandle).not.toHaveBeenCalled();
  });
});
