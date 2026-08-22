import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUser } from "./index";
import { NETWORK_ERROR_MESSAGE } from "../../shared/error";

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock("../../../utils/client", () => ({
  createBeatfolioBffClient: () => ({
    api: { users: { $post: postMock } },
  }),
}));

describe("createUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("成功したら ok を返す", async () => {
    postMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ userId: "user-1", artistId: "artist-1" }),
    });

    const result = await createUser({
      email: "user@example.com",
      accountId: "newbie",
    });

    expect(postMock).toHaveBeenCalledWith({
      json: { email: "user@example.com", accountId: "newbie" },
    });
    expect(result).toStrictEqual({ ok: true, value: undefined });
  });

  it("409 はエラーメッセージ付きの rejected を返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "User already registered" }),
    });

    const result = await createUser({
      email: "user@example.com",
      accountId: "taken",
    });

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "rejected", message: "User already registered" },
    });
  });

  it("エラー本文が無ければフォールバックメッセージを返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({}),
    });

    const result = await createUser({
      email: "user@example.com",
      accountId: "newbie",
    });

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "rejected", message: "ユーザー作成に失敗しました" },
    });
  });

  it("500 は unexpected を返す", async () => {
    postMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const result = await createUser({
      email: "user@example.com",
      accountId: "newbie",
    });

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: "ユーザー作成に失敗しました" },
    });
  });

  it("通信に失敗したら unexpected を返す", async () => {
    postMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await createUser({
      email: "user@example.com",
      accountId: "newbie",
    });

    expect(result).toStrictEqual({
      ok: false,
      error: { kind: "unexpected", message: NETWORK_ERROR_MESSAGE },
    });
  });
});
