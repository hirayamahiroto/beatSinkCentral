import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../../../../../domain/artistProfiles/factories";
import type { ArtistProfilePersistenceData } from "../../../../../../../domain/artistProfiles/entities";
import saveMyProfile from "./index";

const mockUserRepository = { findBySub: vi.fn() };
const mockArtistRepository = { findByUserId: vi.fn() };
const mockArtistProfileRepository = {
  findByArtistId: vi.fn(),
  upsert: vi.fn(),
};
const mockTxRunner = {
  run: vi.fn(async (fn: (tx: unknown) => unknown) => fn({})),
};

vi.mock("../../../../../../../infrastructure/container", () => ({
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
  app.route("/", saveMyProfile);
  return app;
};

describe("POST /artists/me/profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("プロフィールを保存し、view を返す", async () => {
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
    mockArtistProfileRepository.findByArtistId.mockResolvedValue(null);
    mockArtistProfileRepository.upsert.mockImplementation(
      async (data: ArtistProfilePersistenceData) =>
        reconstructArtistProfile({ ...data }),
    );

    const res = await createApp("auth0|123").request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Taro", genres: ["bass"] }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.accountId).toBe("beatboxer_taro");
    expect(body.profile.name).toBe("Taro");
    expect(mockArtistProfileRepository.upsert).toHaveBeenCalledTimes(1);
  });
});
