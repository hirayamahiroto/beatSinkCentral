import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../domain/artists/factories";
import { handleAppError } from "../../../../../../errorMap";
import updateAccountIdRoute from "./index";

const mockArtists = {
  save: vi.fn(),
  findByUserId: vi.fn(),
  findByAccountId: vi.fn(),
  updateAccountId: vi.fn(),
};

const mockResolveActorState = vi.fn();

vi.mock("../../../../../../middlewares/auth0", () => ({
  requireAuthMiddleware: async (
    _c: unknown,
    next: () => Promise<void>,
  ): Promise<void> => next(),
}));

vi.mock("../../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => ({
    resolveActorState: (subId: string) => mockResolveActorState(subId),
    runWithArtistWriteCapabilities: (
      actor: unknown,
      work: (caps: unknown) => Promise<unknown>,
    ) => work({ actor, artists: mockArtists }),
  }),
}));

const owner = reconstructUser({
  id: "user-1",
  subId: "auth0|123",
  email: "test@example.com",
});

const ownedArtist = reconstructArtist({
  artistId: "artist-1",
  accountId: "old_handle",
  ownerUserId: owner.getId(),
  profile: null,
});

const createApp = () => {
  const app = new Hono();
  app.use("*", async (c, next) => {
    c.set("auth0User", { sub: "auth0|123" });
    await next();
  });
  app.route("/", updateAccountIdRoute);
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
    mockArtists.updateAccountId.mockImplementation(async () =>
      reconstructArtist({
        artistId: "artist-1",
        accountId: "new_handle",
        ownerUserId: owner.getId(),
        profile: null,
      }),
    );
  });

  it("Actor と一致する artistId なら accountId を更新する", async () => {
    const res = await request("artist-1", { accountId: "new_handle" });

    expect(res.status).toBe(200);
    expect(mockArtists.updateAccountId).toHaveBeenCalledTimes(1);
  });

  it("Actor と一致しない artistId は 404 を返し、更新しない", async () => {
    const res = await request("other-artist", { accountId: "new_handle" });

    expect(res.status).toBe(404);
    expect(mockArtists.updateAccountId).not.toHaveBeenCalled();
  });

  it("actor が解決できなければ 404 を返す", async () => {
    mockResolveActorState.mockResolvedValue({ status: "unregistered" });

    const res = await request("artist-1", { accountId: "new_handle" });

    expect(res.status).toBe(404);
    expect(mockArtists.updateAccountId).not.toHaveBeenCalled();
  });

  it("accountId が空なら 400 を返し、更新しない", async () => {
    const res = await request("artist-1", { accountId: "" });

    expect(res.status).toBe(400);
    expect(mockArtists.updateAccountId).not.toHaveBeenCalled();
  });
});
