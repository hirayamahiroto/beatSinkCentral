import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../../../../../domain/artistProfiles/factories";
import getMyProfile from "./index";

const mockUserRepository = { findBySub: vi.fn() };
const mockArtistRepository = { findByUserId: vi.fn() };
const mockArtistProfileRepository = { findByArtistId: vi.fn() };

vi.mock("../../../../../../../infrastructure/container", () => ({
  getContainer: () => ({
    userRepository: mockUserRepository,
    artistRepository: mockArtistRepository,
    artistProfileRepository: mockArtistProfileRepository,
  }),
}));

const createApp = (sub: string) => {
  const app = new Hono();
  app.use("*", async (c, next) => {
    c.set("auth0User", { sub } as never);
    await next();
  });
  app.route("/", getMyProfile);
  return app;
};

const user = reconstructUser({
  id: "user-1",
  subId: "auth0|123",
  email: "t@e.com",
});
const artist = reconstructArtist({
  artistId: "artist-1",
  accountId: "beatboxer_taro",
  ownerUserId: "user-1",
  profile: null,
});

describe("GET /artists/me/profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("プロフィール未作成なら profile:null を返す", async () => {
    mockUserRepository.findBySub.mockResolvedValue(user);
    mockArtistRepository.findByUserId.mockResolvedValue(artist);
    mockArtistProfileRepository.findByArtistId.mockResolvedValue(null);

    const res = await createApp("auth0|123").request("/", { method: "GET" });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({
      accountId: "beatboxer_taro",
      profile: null,
    });
  });

  it("作成済みなら profile view を返す", async () => {
    mockUserRepository.findBySub.mockResolvedValue(user);
    mockArtistRepository.findByUserId.mockResolvedValue(artist);
    mockArtistProfileRepository.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "p1",
        artistId: "artist-1",
        published: false,
        name: "Taro",
        genres: ["bass"],
      }),
    );

    const res = await createApp("auth0|123").request("/", { method: "GET" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.profile.name).toBe("Taro");
  });
});
