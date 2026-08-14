import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../domain/artists/factories";
import { handleAppError } from "../../../../../../errorMap";
import updateMyAccountIdRoute, {
  type UpdateMyAccountIdRequestBody,
} from "./index";

const mockArtists = {
  save: vi.fn(),
  findByUserId: vi.fn(),
  findByAccountId: vi.fn(),
  updateAccountId: vi.fn(),
};

const mockResolveActorState = vi.fn();

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

const createAppWithAuth = () => {
  const app = new Hono();
  app.use("*", async (c, next) => {
    c.set("auth0User", { sub: "auth0|123" });
    await next();
  });
  app.route("/", updateMyAccountIdRoute);
  app.onError(handleAppError);
  return app;
};

const postAccountId = (body: UpdateMyAccountIdRequestBody) =>
  createAppWithAuth().request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /artists/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveActorState.mockResolvedValue({
      status: "complete",
      actor: { user: owner, artist: ownedArtist },
    });
    mockArtists.findByAccountId.mockResolvedValue(null);
  });

  it("accountIdを更新して200と更新後の値を返す", async () => {
    mockArtists.updateAccountId.mockResolvedValue(
      reconstructArtist({
        artistId: ownedArtist.getArtistId(),
        accountId: "new_handle",
        ownerUserId: owner.getId(),
        profile: null,
      }),
    );

    const res = await postAccountId({ accountId: "new_handle" });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({
      artistId: "artist-1",
      accountId: "new_handle",
    });
  });

  it("accountIdが空文字なら400を返す", async () => {
    const res = await postAccountId({ accountId: "" });

    expect(res.status).toBe(400);
    expect(mockArtists.updateAccountId).not.toHaveBeenCalled();
  });

  it("accountIdがVOの形式に反する場合は422を返し、更新しない", async () => {
    const res = await postAccountId({ accountId: "invalid handle" });

    expect(res.status).toBe(422);
    expect(await res.json()).toStrictEqual({
      error: "Invalid accountId format",
    });
    expect(mockArtists.updateAccountId).not.toHaveBeenCalled();
  });

  it("ユーザーが未登録なら404を返し、更新しない", async () => {
    mockResolveActorState.mockResolvedValue({ status: "unregistered" });

    const res = await postAccountId({ accountId: "new_handle" });

    expect(res.status).toBe(404);
    expect(await res.json()).toStrictEqual({ error: "User not found" });
    expect(mockArtists.updateAccountId).not.toHaveBeenCalled();
  });

  it("artistが紐付いていなければ404を返し、更新しない", async () => {
    mockResolveActorState.mockResolvedValue({
      status: "userOnly",
      user: owner,
    });

    const res = await postAccountId({ accountId: "new_handle" });

    expect(res.status).toBe(404);
    expect(await res.json()).toStrictEqual({ error: "Artist not found" });
    expect(mockArtists.updateAccountId).not.toHaveBeenCalled();
  });

  it("他のartistが使用中のaccountIdなら409と衝突した値を含むメッセージを返す", async () => {
    mockArtists.findByAccountId.mockResolvedValue(
      reconstructArtist({
        artistId: "artist-2",
        accountId: "new_handle",
        ownerUserId: "other-user",
        profile: null,
      }),
    );

    const res = await postAccountId({ accountId: "new_handle" });
    const body = (await res.json()) as { error: string };

    expect(res.status).toBe(409);
    expect(body.error).toContain("new_handle");
    expect(mockArtists.updateAccountId).not.toHaveBeenCalled();
  });
});
