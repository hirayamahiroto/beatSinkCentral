import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../domain/artists/factories";
import type { AuthenticatedUser } from "../../../../../../middlewares/auth0";
import getMeRoute from "./index";

const mockResolveActorState = vi.fn();

vi.mock("../../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => ({
    resolveActorState: (subId: string) => mockResolveActorState(subId),
  }),
}));

const user = reconstructUser({
  id: "user-1",
  subId: "auth0|123",
  email: "test@example.com",
});

const artist = reconstructArtist({
  artistId: "artist-1",
  accountId: "user_123",
  ownerUserId: "user-1",
  profile: { name: "Test" },
});

const createAppWithAuth = (auth0User: AuthenticatedUser) => {
  const app = new Hono();
  app.use("*", async (c, next) => {
    c.set("auth0User", auth0User);
    await next();
  });
  app.route("/", getMeRoute);
  return app;
};

describe("GET /users/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未登録ユーザーの場合は404にせずregistered:falseを返す", async () => {
    mockResolveActorState.mockResolvedValue({ status: "unregistered" });
    const app = createAppWithAuth({ sub: "auth0|unknown" });

    const res = await app.request("/", { method: "GET" });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ registered: false });
  });

  it("登録済みでartist未紐付けの場合はartist:nullを返す", async () => {
    mockResolveActorState.mockResolvedValue({ status: "userOnly", user });
    const app = createAppWithAuth({ sub: "auth0|123" });

    const res = await app.request("/", { method: "GET" });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({
      registered: true,
      userId: "user-1",
      email: "test@example.com",
      artist: null,
    });
  });

  it("登録済みでartistが紐付いている場合はartist情報を返す", async () => {
    mockResolveActorState.mockResolvedValue({
      status: "complete",
      actor: { user, artist },
    });
    const app = createAppWithAuth({ sub: "auth0|123" });

    const res = await app.request("/", { method: "GET" });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({
      registered: true,
      userId: "user-1",
      email: "test@example.com",
      artist: {
        artistId: "artist-1",
        accountId: "user_123",
        hasProfile: true,
      },
    });
  });

  it("セッションの sub で Actor を解決する", async () => {
    mockResolveActorState.mockResolvedValue({ status: "unregistered" });
    const app = createAppWithAuth({ sub: "auth0|999" });

    await app.request("/", { method: "GET" });

    expect(mockResolveActorState).toHaveBeenCalledWith("auth0|999");
  });
});
