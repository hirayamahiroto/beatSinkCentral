import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../../../../../../domain/artistProfiles/factories";
import { publish } from "../../../../../../../../domain/artistProfiles/operations";
import publishMyProfile from "./index";

const mockUserRepository = { findBySub: vi.fn() };
const mockArtistRepository = { findByUserId: vi.fn() };
const mockArtistProfileRepository = {
  findByArtistId: vi.fn(),
  setPublished: vi.fn(),
};
const mockTxRunner = {
  run: vi.fn(async (fn: (tx: unknown) => unknown) => fn({})),
};

vi.mock("../../../../../../../../infrastructure/container", () => ({
  getContainer: () => ({
    userRepository: mockUserRepository,
    artistRepository: mockArtistRepository,
    artistProfileRepository: mockArtistProfileRepository,
    txRunner: mockTxRunner,
  }),
}));

const createApp = (sub: string) => {
  const app = new Hono();
  app.use("*", async (c, next) => {
    c.set("auth0User", { sub } as never);
    await next();
  });
  app.route("/", publishMyProfile);
  return app;
};

describe("POST /artists/me/profile/publish", () => {
  beforeEach(() => vi.clearAllMocks());

  it("最小核が揃ったプロフィールを公開し published:true を返す", async () => {
    mockUserRepository.findBySub.mockResolvedValue(
      reconstructUser({ id: "user-1", subId: "auth0|123", email: "t@e.com" }),
    );
    mockArtistRepository.findByUserId.mockResolvedValue(
      reconstructArtist({
        artistId: "artist-1",
        accountId: "beatboxer_taro",
        ownerUserId: "user-1",
        profile: null,
      }),
    );
    const publishable = reconstructArtistProfile({
      id: "p1",
      artistId: "artist-1",
      published: false,
      name: "Taro",
      imageUrl: "https://example.com/a.png",
      story: "私の歩み",
      genres: ["bass"],
      links: [{ type: "x", url: "https://x.com/taro" }],
    });
    mockArtistProfileRepository.findByArtistId.mockResolvedValue(publishable);
    mockArtistProfileRepository.setPublished.mockResolvedValue(
      publish(publishable),
    );

    const res = await createApp("auth0|123").request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ published: true }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ published: true });
  });

  const seedUserAndArtist = () => {
    mockUserRepository.findBySub.mockResolvedValue(
      reconstructUser({ id: "user-1", subId: "auth0|123", email: "t@e.com" }),
    );
    mockArtistRepository.findByUserId.mockResolvedValue(
      reconstructArtist({
        artistId: "artist-1",
        accountId: "beatboxer_taro",
        ownerUserId: "user-1",
        profile: null,
      }),
    );
  };

  const post = (published: boolean) =>
    createApp("auth0|123").request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ published }),
    });

  it("公開必須が欠けていると errorMap 経由で 422 + missingFields を返す", async () => {
    seedUserAndArtist();
    mockArtistProfileRepository.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "p1",
        artistId: "artist-1",
        published: false,
        name: "Taro",
      }),
    );

    const res = await post(true);

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe(
      "Profile is not publishable: required fields are missing",
    );
    expect([...body.details.missingFields].sort()).toEqual(
      ["genres", "imageUrl", "links", "story"].sort(),
    );
    expect(mockArtistProfileRepository.setPublished).not.toHaveBeenCalled();
  });

  it("プロフィール未作成なら errorMap 経由で 404 を返す", async () => {
    seedUserAndArtist();
    mockArtistProfileRepository.findByArtistId.mockResolvedValue(null);

    const res = await post(true);

    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Artist profile not found");
  });

  it("ユーザー未登録なら errorMap 経由で 404 を返す", async () => {
    mockUserRepository.findBySub.mockResolvedValue(null);

    const res = await post(true);

    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("User not found");
  });
});
