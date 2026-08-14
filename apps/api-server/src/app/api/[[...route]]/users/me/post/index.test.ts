import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../domain/artists/factories";
import { createEmailAlreadyTakenError } from "../../../../../../domain/users/errors/emailAlreadyTaken";
import { handleAppError } from "../../../../../../errorMap";
import updateMyEmailRoute from "./index";

const mockUsers = {
  findBySub: vi.fn(),
  save: vi.fn(),
  updateEmail: vi.fn(),
};

const mockResolveActorState = vi.fn();

vi.mock("../../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => ({
    resolveActorState: (subId: string) => mockResolveActorState(subId),
    runWithUserWriteCapabilities: (
      user: unknown,
      work: (caps: unknown) => Promise<unknown>,
    ) => work({ user, users: mockUsers }),
  }),
}));

const user = reconstructUser({
  id: "user-1",
  subId: "auth0|123",
  email: "old@example.com",
});

const artist = reconstructArtist({
  artistId: "artist-1",
  accountId: "user_123",
  ownerUserId: "user-1",
  profile: null,
});

const createApp = () => {
  const app = new Hono();
  app.use("*", async (c, next) => {
    c.set("auth0User", { sub: "auth0|123" });
    await next();
  });
  app.route("/", updateMyEmailRoute);
  app.onError(handleAppError);
  return app;
};

const postEmail = (email: string) =>
  createApp().request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });

describe("POST /users/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveActorState.mockResolvedValue({
      status: "complete",
      actor: { user, artist },
    });
  });

  it("emailを更新して200と更新後の値を返す", async () => {
    mockUsers.updateEmail.mockResolvedValue(
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

  it("アーティストが未作成でもemailを更新して200を返す", async () => {
    mockResolveActorState.mockResolvedValue({ status: "userOnly", user });
    mockUsers.updateEmail.mockResolvedValue(
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
    mockResolveActorState.mockResolvedValue({ status: "unregistered" });

    const res = await postEmail("new@example.com");

    expect(res.status).toBe(404);
    expect(await res.json()).toStrictEqual({ error: "User not found" });
    expect(mockUsers.updateEmail).not.toHaveBeenCalled();
  });

  it("emailが他ユーザーに使われていたら409を返し、emailを露出しない", async () => {
    mockUsers.updateEmail.mockRejectedValue(createEmailAlreadyTakenError());

    const res = await postEmail("taken@example.com");

    expect(res.status).toBe(409);
    expect(await res.json()).toStrictEqual({ error: "Email already taken" });
  });

  it("emailの形式が不正なら422を返し、更新しない", async () => {
    const res = await postEmail("invalid");

    expect(res.status).toBe(422);
    expect(await res.json()).toStrictEqual({ error: "Invalid email format" });
    expect(mockUsers.updateEmail).not.toHaveBeenCalled();
  });

  it("emailが空文字列なら400を返す", async () => {
    const res = await postEmail("");

    expect(res.status).toBe(400);
    expect(mockUsers.updateEmail).not.toHaveBeenCalled();
  });
});
