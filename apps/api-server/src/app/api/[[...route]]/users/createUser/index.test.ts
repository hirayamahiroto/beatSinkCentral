import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import usersCreate, { type CreateUserRequestBody } from "./index";
import { handleAppError } from "../../../../../errorMap";
import { reconstructUser } from "../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../domain/artists/factories";
import { createEmailAlreadyTakenError } from "../../../../../domain/users/errors/emailAlreadyTaken";

const mockUsers = {
  save: vi.fn(),
  findBySub: vi.fn(),
  updateEmail: vi.fn(),
};

const mockArtists = {
  save: vi.fn(),
  findByUserId: vi.fn(),
  findByHandle: vi.fn(),
  updateHandle: vi.fn(),
};

vi.mock("../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => ({
    runWithRegistrationCapabilities: (
      work: (caps: unknown) => Promise<unknown>,
    ) => work({ users: mockUsers, artists: mockArtists }),
  }),
}));

const app = new Hono().route("/", usersCreate).onError(handleAppError);

const createAppWithAuth = () => {
  const authed = new Hono();
  authed.use("*", async (c, next) => {
    c.set("auth0User", { sub: "auth0|123" });
    await next();
  });
  authed.route("/", usersCreate);
  return authed;
};

const postCreate = (body: CreateUserRequestBody) =>
  createAppWithAuth().request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("User Create API", () => {
  describe("POST / - バリデーション", () => {
    it("正しい形式でも認証なしなら201を返さない", async () => {
      const payload = {
        email: "test@example.com",
        handle: "test_account",
      } satisfies CreateUserRequestBody;

      const res = await app.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect(res.status).not.toBe(201);
    });

    it("emailが空文字列の場合は400を返す", async () => {
      const invalidPayload: CreateUserRequestBody = {
        email: "",
        handle: "test_account",
      };

      const res = await app.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
    });

    it("handleが空文字列の場合は400を返す", async () => {
      const invalidPayload: CreateUserRequestBody = {
        email: "test@example.com",
        handle: "",
      };

      const res = await app.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
    });

    it("必須フィールドが欠けている場合は400を返す", async () => {
      const res = await app.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });

    it("型が不正な値の場合は400を返す", async () => {
      const res = await app.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: 123, handle: 456 }),
      });

      expect(res.status).toBe(400);
    });

    it("emailの形式が不正な場合は400と Invalid email format メッセージを返す", async () => {
      const invalidPayload: CreateUserRequestBody = {
        email: "not-an-email",
        handle: "test_account",
      };

      const res = await app.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({
        error: "Invalid request",
        details: expect.arrayContaining([
          expect.objectContaining({
            path: ["email"],
            message: "Invalid email format",
          }),
        ]),
      });
    });

    it("handleが256文字以上の場合は400と長さ超過メッセージを返す", async () => {
      const invalidPayload: CreateUserRequestBody = {
        email: "test@example.com",
        handle: "a".repeat(256),
      };

      const res = await app.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({
        details: expect.arrayContaining([
          expect.objectContaining({
            path: ["handle"],
            message: "handle must be 255 characters or less",
          }),
        ]),
      });
    });

    it("emailが空文字列の場合は email is required メッセージを返す", async () => {
      const invalidPayload: CreateUserRequestBody = {
        email: "",
        handle: "test_account",
      };

      const res = await app.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({
        details: expect.arrayContaining([
          expect.objectContaining({
            path: ["email"],
            message: "email is required",
          }),
        ]),
      });
    });
  });

  describe("POST / - ドメインの失敗をHTTPへ変換する", () => {
    const validPayload = {
      email: "test@example.com",
      handle: "test_account",
    } satisfies CreateUserRequestBody;

    beforeEach(() => {
      vi.clearAllMocks();
      mockUsers.findBySub.mockResolvedValue(null);
      mockArtists.findByHandle.mockResolvedValue(null);
      mockUsers.save.mockResolvedValue(undefined);
      mockArtists.save.mockResolvedValue(undefined);
    });

    it("新規登録に成功すると201とuserId/artistIdを返す", async () => {
      const res = await postCreate(validPayload);

      expect(res.status).toBe(201);
      expect(await res.json()).toMatchObject({
        userId: expect.any(String),
        artistId: expect.any(String),
      });
    });

    it("既に登録済みなら409を返し、保存しない", async () => {
      mockUsers.findBySub.mockResolvedValue(
        reconstructUser({
          id: "user-1",
          subId: "auth0|123",
          email: validPayload.email,
        }),
      );

      const res = await postCreate(validPayload);

      expect(res.status).toBe(409);
      expect(await res.json()).toStrictEqual({
        error: "User already registered",
        code: "UserAlreadyRegisteredError",
      });
      expect(mockUsers.save).not.toHaveBeenCalled();
    });

    it("handleが使用済みなら409と衝突したhandleを含むメッセージを返す", async () => {
      mockArtists.findByHandle.mockResolvedValue(
        reconstructArtist({
          artistId: "artist-1",
          handle: validPayload.handle,
          ownerUserId: "other-user",
          profile: null,
        }),
      );

      const res = await postCreate(validPayload);

      expect(res.status).toBe(409);
      expect(await res.json()).toMatchObject({
        error: expect.stringContaining(validPayload.handle),
      });
      expect(mockArtists.save).not.toHaveBeenCalled();
    });

    it("emailが他ユーザーに使われていたら409を返し、emailを露出しない", async () => {
      mockUsers.save.mockRejectedValue(createEmailAlreadyTakenError());

      const res = await postCreate(validPayload);

      expect(res.status).toBe(409);
      expect(await res.json()).toStrictEqual({
        error: "Email already taken",
        code: "EmailAlreadyTakenError",
      });
      expect(mockArtists.save).not.toHaveBeenCalled();
    });

    it("handleがVOの形式に反する場合は422を返し、保存しない", async () => {
      const res = await postCreate({
        ...validPayload,
        handle: "invalid handle",
      });

      expect(res.status).toBe(422);
      expect(await res.json()).toStrictEqual({
        error: "Invalid handle format",
        code: "InvalidHandleFormatError",
      });
      expect(mockArtists.save).not.toHaveBeenCalled();
    });
  });
});
