import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../domain/artists/factories";
import type { AuthenticatedUser } from "../../../../../middlewares/auth0";
import usersMe from "./index";

const mockUserRepository = {
  save: vi.fn(),
  findBySub: vi.fn(),
  updateEmail: vi.fn(),
};

const mockArtistRepository = {
  findByUserId: vi.fn(),
};

const mockTxRunner = {
  run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
};

vi.mock("../../../../../infrastructure/container", () => ({
  getContainer: () => ({
    userRepository: mockUserRepository,
    artistRepository: mockArtistRepository,
    txRunner: mockTxRunner,
  }),
}));

const mockResolveActorState = vi.fn();

vi.mock("../../../../../infrastructure/capabilities", () => ({
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
  app.route("/", usersMe);
  return app;
};

describe("User Me API", () => {
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

  describe("POST /", () => {
    const postEmail = (email: string) =>
      createAppWithAuth({ sub: "auth0|123" }).request("/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });

    it("emailを更新して200と更新後の値を返す", async () => {
      mockUserRepository.findBySub.mockResolvedValue(
        reconstructUser({
          id: "user-1",
          subId: "auth0|123",
          email: "old@example.com",
        }),
      );
      mockUserRepository.updateEmail.mockResolvedValue(
        reconstructUser({
          id: "user-1",
          subId: "auth0|123",
          email: "new@example.com",
        }),
      );

      const res = await postEmail("new@example.com");

      expect(res.status).toBe(200);
      expect(await res.json()).toStrictEqual({
        userId: "user-1",
        email: "new@example.com",
      });
    });

    it("ユーザーが未登録なら404を返す", async () => {
      mockUserRepository.findBySub.mockResolvedValue(null);

      const res = await postEmail("new@example.com");

      expect(res.status).toBe(404);
      expect(await res.json()).toStrictEqual({ error: "User not found" });
      expect(mockUserRepository.updateEmail).not.toHaveBeenCalled();
    });

    it("emailの形式が不正なら422を返し、トランザクションを開始しない", async () => {
      const res = await postEmail("invalid");

      expect(res.status).toBe(422);
      expect(await res.json()).toStrictEqual({
        error: "Invalid email format",
      });
      expect(mockTxRunner.run).not.toHaveBeenCalled();
    });
  });
});
