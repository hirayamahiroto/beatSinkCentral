import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../domain/artists/factories";
import usersMe from "./index";

const mockUserRepository = {
  save: vi.fn(),
  findBySub: vi.fn(),
};

const mockArtistRepository = {
  findByUserId: vi.fn(),
};

vi.mock("../../../../../infrastructure/container", () => ({
  getContainer: () => ({
    userRepository: mockUserRepository,
    artistRepository: mockArtistRepository,
  }),
}));

const createAppWithAuth = (auth0User: { sub?: string } | null) => {
  const app = new Hono();
  app.use("*", async (c, next) => {
    c.set("auth0User", auth0User as never);
    await next();
  });
  app.route("/", usersMe);
  return app;
};

describe("User Me API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("auth0Userのsubが無い場合は401を返す", async () => {
    const app = createAppWithAuth({});
    const res = await app.request("/", { method: "GET" });

    expect(res.status).toBe(401);
  });

  it("未登録ユーザーの場合はregistered:falseを返す", async () => {
    mockUserRepository.findBySub.mockResolvedValue(null);
    const app = createAppWithAuth({ sub: "auth0|unknown" });

    const res = await app.request("/", { method: "GET" });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ registered: false });
  });

  it("登録済みでartist未紐付けの場合はartist:nullを返す", async () => {
    mockUserRepository.findBySub.mockResolvedValue(
      reconstructUser({
        id: "user-1",
        subId: "auth0|123",
        email: "test@example.com",
      }),
    );
    mockArtistRepository.findByUserId.mockResolvedValue(null);
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
    mockUserRepository.findBySub.mockResolvedValue(
      reconstructUser({
        id: "user-1",
        subId: "auth0|123",
        email: "test@example.com",
      }),
    );
    mockArtistRepository.findByUserId.mockResolvedValue(
      reconstructArtist({
        artistId: "artist-1",
        accountId: "user_123",
        ownerUserId: "user-1",
        profile: { name: "Test" },
      }),
    );
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
});
